// 20 classes defined in obj.names
const CLASSES = [
    'andar', 'circulo', 'inicio', 'looping', 'pegar', 'pular', 'triangulo', 'zzz',
    '2', '3', '4', '5', '6', '7', '8', '9',
    'seta_up', 'seta_down', 'seta_left', 'seta_right'
];

const colors = [
    '#FF3838', '#FF9D97', '#FF701F', '#FFB21D', '#CFD231', '#48F90A', '#92CC17', '#3DDB86',
    '#1A9334', '#00D4BB', '#2C99A8', '#00C2FF', '#344593', '#6473FF', '#0018EC', '#8438FF',
    '#520085', '#CB38FF', '#FF95C8', '#FF37C7'
];

let model;
const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const loadButton = document.getElementById('loadModelBtn');
const startButton = document.getElementById('startCamBtn');

async function loadModel() {
    try {
        console.log("Loading YOLO model...");
        // Load the model from the local server
        model = await tf.loadGraphModel('./model_output/model.json');
        console.log("Model loaded successfully");

        // Warmup
        const dummyInput = tf.zeros([1, 640, 640, 3]);
        model.execute(dummyInput);

        loadButton.disabled = true;
        loadButton.textContent = "Model Loaded";
        startButton.disabled = false;

    } catch (err) {
        console.error("Failed to load model:", err);
        alert("Failed to load model. Make sure python http.server is running in this folder!");
    }
}

async function setupWebcam() {
    return new Promise((resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia ||
            navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
            navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({ video: true },
                stream => {
                    video.srcObject = stream;
                    video.addEventListener('loadeddata', () => resolve(), false);
                },
                error => reject());
        } else {
            reject();
        }
    });
}

function preprocess(video) {
    return tf.tidy(() => {
        // Explicitly create a tensor from the video element
        const cam = tf.browser.fromPixels(video);

        // Resize to 640x640
        const resized = tf.image.resizeBilinear(cam, [640, 640]);

        // Normalize: (x / 255.0)  -> This depends on how the model was trained!
        // YOLOv8 usually expects 0-1 float32
        const normalized = resized.div(tf.scalar(255.0));

        // Add batch dimension: [1, 640, 640, 3]
        const batched = normalized.expandDims(0);
        return batched;
    });
}

async function detectFrame() {
    if (!model) return;

    // Preprocess video frame
    const batched = preprocess(video);

    try {
        // Run inference
        const res = model.execute(batched);
        // res is usually a tensor [1, 4+num_classes, 8400] for YOLOv8
        // or [1, 8400, 4+num_classes] depending on export.

        // Let's assume standard output shape [1, 8400, 4+nc]?
        // Ultralytics JS export usually matches regular export which is [1, 4+nc, 8400]

        const output = res.squeeze(); // [4+nc, 8400]

        const num_channels = output.shape[0];
        const num_anchors = output.shape[1];

        // We transpose to [8400, 24] for easier iteration
        const transposed = output.transpose([1, 0]);
        const data = await transposed.data();

        // Clean up tensors
        batched.dispose();
        res.dispose();
        output.dispose();
        transposed.dispose();

        // Non-Maximum Suppression (NMS)
        const boxes = [];
        const scores = [];
        const classes = [];

        const threshold = 0.25; // Confidence threshold

        for (let i = 0; i < num_anchors; i++) {
            const offset = i * num_channels;

            // Find max class score
            let maxScore = 0;
            let maxClass = -1;

            // Loop over 20 classes
            for (let c = 0; c < 20; c++) {
                const s = data[offset + 4 + c];
                if (s > maxScore) {
                    maxScore = s;
                    maxClass = c;
                }
            }

            if (maxScore > threshold) {
                const xc = data[offset + 0];
                const yc = data[offset + 1];
                const w = data[offset + 2];
                const h = data[offset + 3];

                // Convert center-wh to top-left-xy
                const x = (xc - w / 2) * (canvas.width / 640);
                const y = (yc - h / 2) * (canvas.height / 640);
                const width = w * (canvas.width / 640);
                const height = h * (canvas.height / 640);

                boxes.push([x, y, width, height]);
                scores.push(maxScore);
                classes.push(maxClass);
            }
        }

        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use TF.js NMS
        if (boxes.length > 0) {
            const nmsIndices = await tf.image.nonMaxSuppressionAsync(
                tf.tensor2d(boxes, [boxes.length, 4]),
                tf.tensor1d(scores),
                20, // max output size
                0.45, // iou threshold
                0.25 // score threshold
            );

            const indices = await nmsIndices.data();
            nmsIndices.dispose();

            ctx.font = '18px Arial';
            ctx.lineWidth = 2;

            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                const box = boxes[idx];
                const classId = classes[idx];
                const score = scores[idx];
                const label = CLASSES[classId]; // Directly use the label

                const color = colors[classId % colors.length];
                ctx.strokeStyle = color;
                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.rect(box[0], box[1], box[2], box[3]);
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.fillText(`${label} (${(score * 100).toFixed(1)}%)`, box[0], box[1] > 20 ? box[1] - 5 : box[1] + 15);
            }
        }

    } catch (e) {
        console.error(e);
    }

    requestAnimationFrame(detectFrame);
}

loadButton.addEventListener('click', loadModel);
startButton.addEventListener('click', () => {
    setupWebcam().then(() => {
        detectFrame();
        startButton.disabled = true;
    }).catch(err => {
        console.error(err);
        alert("Failed to start webcam. Please allow access.");
    });
});
