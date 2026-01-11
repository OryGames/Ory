class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    create() {
        this.vision = new VisionHandler(this);

        // Listeners for UI HTML elements
        const overlay = document.getElementById('camera-overlay');
        const btnCapture = document.getElementById('btn-capture');
        const btnClose = document.getElementById('btn-close');

        // Event Open
        this.events.on('openCamera', () => {
            overlay.classList.remove('hidden');
            this.vision.startCamera();
        });

        // Button Capture
        btnCapture.onclick = () => {
            const commands = this.vision.capture();
            console.log("Captured Commands:", commands);

            overlay.classList.add('hidden');

            // Send to Interpreter to Execute
            this.scene.get('LevelScene').executeCommands(commands);
        };

        // Button Close
        btnClose.onclick = () => {
            this.vision.stopCamera();
            overlay.classList.add('hidden');
        };

        // HUD
        this.add.text(10, 10, 'Ory: Level 1', { fontSize: '20px', fill: '#00d4bb' });
    }
}
