class VisionHandler {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.videoElements = {
            video: document.getElementById('webcam'),
            overlay: document.getElementById('camera-overlay'),
            status: document.getElementById('status-text')
        };

        this.isDetecting = false;
        this.detectedBlocks = [];

        this.CLASSES = [
            'andar', 'circulo', 'inicio', 'looping', 'pegar', 'pular', 'triangulo', 'zzz',
            '2', '3', '4', '5', '6', '7', '8', '9',
            'seta_up', 'seta_down', 'seta_left', 'seta_right'
        ];

        this.loadModel();
    }

    async loadModel() {
        try {
            // Check if model was preloaded by PreloaderScene
            if (window.preloadedAIModel) {
                console.log("Vision: Using preloaded YOLO model");
                this.model = window.preloadedAIModel;
                if (this.videoElements.status) {
                    this.videoElements.status.innerText = "IA pronta! Alinhe os blocos.";
                }
                return;
            }

            // Fallback: load model if not preloaded
            console.log("Vision: Loading YOLO...");
            if (this.videoElements.status) {
                this.videoElements.status.innerText = "Carregando IA...";
            }
            this.model = await tf.loadGraphModel('./assets/model/model.json');

            const zeroTensor = tf.zeros([1, 640, 640, 3], 'float32');
            const result = await this.model.execute(zeroTensor);
            tf.dispose(result);
            tf.dispose(zeroTensor);

            console.log("Vision: Model Ready");
            if (this.videoElements.status) {
                this.videoElements.status.innerText = "IA pronta! Alinhe os blocos.";
            }
        } catch (e) {
            console.error(e);
            if (this.videoElements.status) {
                this.videoElements.status.innerText = "Erro ao carregar modelo.";
            }
        }
    }

    async startCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Detect if mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // Mobile uses back camera (environment), desktop uses front camera (user)
            const facingMode = isMobile ? 'environment' : 'user';

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode, width: 640, height: 640 }
            });
            this.videoElements.video.srcObject = stream;

            // Mirror only for front camera (desktop) - back camera (mobile) should not be mirrored
            if (!isMobile) {
                this.videoElements.video.style.transform = 'scaleX(-1)';
            } else {
                this.videoElements.video.style.transform = 'none';
            }

            return new Promise(resolve => {
                this.videoElements.video.onloadedmetadata = () => {
                    this.videoElements.video.play();
                    this.isDetecting = true;
                    this.detectLoop();
                    resolve();
                };
            });
        }
    }

    stopCamera() {
        this.isDetecting = false;
        const stream = this.videoElements.video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElements.video.srcObject = null;
        }
    }

    async detectLoop() {
        if (!this.isDetecting || !this.model) return;

        const tfImg = tf.tidy(() => {
            const cam = tf.browser.fromPixels(this.videoElements.video);
            const resized = tf.image.resizeBilinear(cam, [640, 640]);
            const normalized = resized.div(255.0).expandDims(0);
            return normalized;
        });

        try {
            const res = await this.model.execute(tfImg);
            const prediction = res.squeeze();
            const transposed = prediction.transpose([1, 0]);
            const data = await transposed.data();

            tf.dispose([res, prediction, transposed]);

            const boxes = this.processResults(data);
            this.detectedBlocks = boxes;

            if (this.videoElements.status) {
                if (boxes.length > 0) {
                    this.videoElements.status.innerText = `Detectados: ${boxes.length} blocos`;
                } else {
                    this.videoElements.status.innerText = "Nenhum bloco detectado...";
                }
            }
        } catch (e) {
            console.error(e);
        }

        tf.dispose(tfImg);

        if (this.isDetecting) {
            requestAnimationFrame(() => this.detectLoop());
        }
    }

    processResults(data) {
        const num_anchors = 8400;
        const nc = 20;
        const dims = nc + 4;

        let rawBoxes = [];

        for (let i = 0; i < num_anchors; i++) {
            const offset = i * dims;

            let maxScore = 0;
            let maxClass = -1;
            for (let c = 0; c < nc; c++) {
                const s = data[offset + 4 + c];
                if (s > maxScore) {
                    maxScore = s;
                    maxClass = c;
                }
            }

            if (maxScore > 0.4) {
                const xc = data[offset + 0];
                const yc = data[offset + 1];
                const w = data[offset + 2];
                const h = data[offset + 3];

                rawBoxes.push({
                    x: xc,
                    y: yc,
                    w: w,
                    h: h,
                    score: maxScore,
                    classId: maxClass,
                    label: this.CLASSES[maxClass]
                });
            }
        }

        // Simple NMS
        rawBoxes.sort((a, b) => b.score - a.score);
        const finalBoxes = [];

        while (rawBoxes.length > 0) {
            const current = rawBoxes.shift();
            finalBoxes.push(current);
            rawBoxes = rawBoxes.filter(b => this.iou(current, b) < 0.45);
        }

        return finalBoxes;
    }

    iou(a, b) {
        const x1 = Math.max(a.x - a.w / 2, b.x - b.w / 2);
        const y1 = Math.max(a.y - a.h / 2, b.y - b.h / 2);
        const x2 = Math.min(a.x + a.w / 2, b.x + b.w / 2);
        const y2 = Math.min(a.y + a.h / 2, b.y + b.h / 2);

        if (x2 < x1 || y2 < y1) return 0;

        const intersection = (x2 - x1) * (y2 - y1);
        const areaA = a.w * a.h;
        const areaB = b.w * b.h;

        return intersection / (areaA + areaB - intersection);
    }

    capture() {
        this.stopCamera();

        // Group blocks by line (similar Y coordinate)
        // Then sort each line by X (left to right)
        const boxes = [...this.detectedBlocks];

        // Sort by Y first
        boxes.sort((a, b) => a.y - b.y);

        // Group into lines (blocks within 40px vertically are same line)
        const lines = [];
        let currentLine = [];
        let lastY = -1000;

        for (const box of boxes) {
            if (Math.abs(box.y - lastY) > 40) {
                // New line
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = [box];
                lastY = box.y;
            } else {
                currentLine.push(box);
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        // Sort each line by X (left to right)
        lines.forEach(line => line.sort((a, b) => a.x - b.x));

        // Convert to command structure
        // Each line = one command object with all its parts
        const commands = lines.map(line => {
            return line.map(b => b.label);
        });

        console.log("Parsed Commands (by line):", commands);
        return commands;
    }
}
