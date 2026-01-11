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
        this.detectedBlocks = []; // Last valid detected frame

        this.CLASSES = [
            'andar', 'circulo', 'inicio', 'looping', 'pegar', 'pular', 'triangulo', 'zzz',
            '2', '3', '4', '5', '6', '7', '8', '9',
            'seta_up', 'seta_down', 'seta_left', 'seta_right'
        ];

        this.loadModel();
    }

    async loadModel() {
        try {
            console.log("Vision: Loading YOLO...");
            this.videoElements.status.innerText = "Loading AI Model...";
            this.model = await tf.loadGraphModel('./assets/model/model.json');

            // Warmup
            const zeroTensor = tf.zeros([1, 640, 640, 3], 'float32');
            const result = await this.model.execute(zeroTensor);
            tf.dispose(result);
            tf.dispose(zeroTensor);

            console.log("Vision: Model Ready");
            this.videoElements.status.innerText = "Model Ready. Align blocks!";
        } catch (e) {
            console.error(e);
            this.videoElements.status.innerText = "Error loading model.";
        }
    }

    async startCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 640, height: 640 }
            });
            this.videoElements.video.srcObject = stream;

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

        // 1. Preprocess
        const tfImg = tf.tidy(() => {
            const cam = tf.browser.fromPixels(this.videoElements.video);
            const resized = tf.image.resizeBilinear(cam, [640, 640]);
            const normalized = resized.div(255.0).expandDims(0);
            return normalized;
        });

        // 2. Predict
        try {
            const res = await this.model.execute(tfImg);
            const prediction = res.squeeze(); // [4+nc, anchors] or [anchors, 4+nc]

            // Should be [output_channels, anchors] -> usually [24, 8400] for nc=20
            const transposed = prediction.transpose([1, 0]); // [8400, 24]
            const data = await transposed.data();

            tf.dispose([res, prediction, transposed]);

            const boxes = this.processResults(data);

            // Store detected blocks (sorted by Y for execution order)
            // Filter out low confidence
            this.detectedBlocks = boxes;

            // Update UI status?
            if (boxes.length > 0) {
                this.videoElements.status.innerText = `Detected ${boxes.length} blocks`;
            } else {
                this.videoElements.status.innerText = "No blocks detected...";
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
        // Parse YOLO output
        const num_anchors = 8400; // Standard v8n
        const nc = 20;
        const dims = nc + 4;

        let rawBoxes = [];
        let rawScores = [];
        let rawClasses = [];

        for (let i = 0; i < num_anchors; i++) {
            const update = data.slice(i * dims, (i + 1) * dims);

            // Find max score
            let maxScore = 0;
            let maxClass = -1;
            for (let c = 0; c < nc; c++) {
                const s = update[4 + c];
                if (s > maxScore) {
                    maxScore = s;
                    maxClass = c;
                }
            }

            if (maxScore > 0.4) { // Threshold
                const xc = update[0];
                const yc = update[1];
                const w = update[2];
                const h = update[3];

                // Box format [y1, x1, y2, x2] for TFJS NMS? No, NMS takes [y1, x1, y2, x2] usually
                // But generally simpler to do JS NMS or manual NMS if Tensor based is annoying.
                // Let's use simple manual checking here for simplicity relying on high confidence

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

        // Simple NMS (Greedy)
        rawBoxes.sort((a, b) => b.score - a.score);
        const finalBoxes = [];

        while (rawBoxes.length > 0) {
            const current = rawBoxes.shift();
            finalBoxes.push(current);

            rawBoxes = rawBoxes.filter(b => {
                // Calc IoU
                return this.iou(current, b) < 0.45;
            });
        }

        // Sort final boxes top-to-bottom (Y) then left-to-right (X)
        // Primary sort Y (with some tolerance), Secondary X
        finalBoxes.sort((a, b) => {
            const dy = Math.abs(a.y - b.y);
            if (dy > 30) { // If Y diff is significant, use Y
                return a.y - b.y;
            }
            return a.x - b.x; // Else Sort X line-by-lineish
        });

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
        // Return current detected blocks
        this.stopCamera();
        return this.detectedBlocks.map(b => b.label);
    }
}
