const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const loadModelBtn = document.getElementById('loadModelBtn');
const startCamBtn = document.getElementById('startCamBtn');
const statusElem = document.getElementById('status');

let model;
let digitModel;
let classNames = [];
let digitClasses = ['2', '3', '4', '5', '6', '7', '8', '9']; // Default, will verify against classes.json if needed

// Load class names from obj.names (hardcoded for now or fetch)
// Based on previous tool output:
const CLASSES = ['numero', 'andar', 'circulo', 'inicio', 'looping', 'pegar', 'pular', 'seta', 'triangulo', 'zzz'];

loadModelBtn.addEventListener('click', async () => {
    try {
        statusElem.innerText = 'Status: Loading models...';
        // Load the model from the local file system (served via http-server)
        // Adjust path if needed. 
        model = await tf.loadGraphModel('model_output/model.json');

        // Load Digit Classifier
        try {
            digitModel = await tf.loadLayersModel('digit_model_js/model.json');
            console.log("Digit model loaded");
        } catch (e) {
            console.warn("Failed to load digit model", e);
        }

        statusElem.innerText = 'Status: Models loaded! Ready to start webcam.';
        loadModelBtn.disabled = true;
        startCamBtn.disabled = false;

        // Warmup
        const dummyInput = tf.zeros([1, 640, 640, 3]);
        model.execute(dummyInput);
        tf.dispose(dummyInput);

        if (digitModel) {
            const dummyDigit = tf.zeros([1, 64, 64, 3]);
            digitModel.predict(dummyDigit);
            tf.dispose(dummyDigit);
        }

    } catch (e) {
        console.error(e);
        statusElem.innerText = 'Status: Error loading model. Check console.';
    }
});

startCamBtn.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 640 }
                }
            });
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                detectFrame();
            };

            startCamBtn.disabled = true;
            statusElem.innerText = 'Status: API Running';
        } catch (e) {
            console.error(e);
            statusElem.innerText = 'Status: Error accessing webcam.';
        }
    }
});

async function detectFrame() {
    if (!model) return;

    // 1. Preprocess
    const tfImg = tf.browser.fromPixels(video);
    const info = {
        width: video.videoWidth,
        height: video.videoHeight
    };

    // Resize to 640x640, normalize to [0,1]
    const resized = tf.image.resizeBilinear(tfImg, [640, 640]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0); // [1, 640, 640, 3]

    // 2. Inference
    const res = model.execute(batched);

    // Output shape for YOLOv8n: [1, 4 + nc, 8400] -> [1, 14, 8400]
    // 0-3: cx, cy, w, h
    // 4-13: class probs

    const output = res.squeeze(); // [14, 8400]
    const trans = output.transpose([1, 0]); // [8400, 14]

    const boxes = [];
    const scores = [];
    const classIndices = [];

    // Extract data
    const data = await trans.data();

    const numAnchors = 8400;
    const numClasses = CLASSES.length;
    const stride = 4 + numClasses;

    for (let i = 0; i < numAnchors; i++) {
        const row = i * stride;

        // Find max class score
        let maxScore = -Infinity;
        let maxClass = -1;

        for (let c = 0; c < numClasses; c++) {
            const score = data[row + 4 + c];
            if (score > maxScore) {
                maxScore = score;
                maxClass = c;
            }
        }

        if (maxScore > 0.4) { // Confidence threshold
            const cx = data[row];
            const cy = data[row + 1];
            const w = data[row + 2];
            const h = data[row + 3];

            boxes.push([
                cx - w / 2, // x1
                cy - h / 2, // y1
                w,          // width
                h           // height
            ]);
            scores.push(maxScore);
            classIndices.push(maxClass);
        }
    }

    // 3. NMS
    if (boxes.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas if no boxes
        tf.dispose([tfImg, resized, normalized, batched, res, output, trans]);
        requestAnimationFrame(detectFrame);
        return;
    }

    const nmsIndices = await tf.image.nonMaxSuppressionAsync(
        tf.tensor2d(boxes, [boxes.length, 4]),
        tf.tensor1d(scores),
        20, // max output size
        0.45, // iou threshold
        0.4 // score threshold
    );

    const indices = await nmsIndices.data();

    // 4. Draw & Secondary Classification
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale factors
    const scaleX = canvas.width / 640;
    const scaleY = canvas.height / 640;
    // Assuming video is also 640x640 roughly. If not, need more complex scaling.
    // For demo output matching input tensor size:

    ctx.font = '16px sans-serif';
    ctx.lineWidth = 2;

    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        const box = boxes[idx];
        const score = scores[idx];
        const cls = classIndices[idx];

        let label = CLASSES[cls];

        // Classification logic for "numero"
        if (label === 'numero' && digitModel) {
            // Crop from original normalized image (640x640)
            // Box format in 'boxes' array is [x1, y1, w, h] in 640 pixel coords
            const x1 = Math.max(0, box[0]);
            const y1 = Math.max(0, box[1]);
            const width = box[2];
            const height = box[3];

            if (width > 0 && height > 0) {
                const crop = tf.image.cropAndResize(
                    batched,
                    [[y1 / 640, x1 / 640, (y1 + height) / 640, (x1 + width) / 640]],
                    [0],
                    [64, 64]
                );

                const digitPred = digitModel.predict(crop);
                const digitScore = await digitPred.data();
                const maxVal = Math.max(...digitScore);
                const digitIdx = digitScore.indexOf(maxVal);

                label = `Num: ${digitClasses[digitIdx]}`;

                tf.dispose([crop, digitPred]);
            }
        }

        const x = box[0] * scaleX;
        const y = box[1] * scaleY;
        const w = box[2] * scaleX;
        const h = box[3] * scaleY;

        // Color based on class (simple hash)
        const color = `hsl(${cls * 360 / numClasses}, 100%, 50%)`;

        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = color;
        const text = `${label} ${(score * 100).toFixed(1)}%`;
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x, y - 20, textWidth + 4, 20);

        ctx.fillStyle = 'white';
        ctx.fillText(text, x + 2, y - 5);
    }

    // Cleanup tensors
    tf.dispose([tfImg, resized, normalized, batched, res, output, trans, nmsIndices]);

    requestAnimationFrame(detectFrame);
}
