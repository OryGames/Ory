class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Initialize VisionHandler only once
        if (!this.vision) {
            this.vision = new VisionHandler(this);
        }

        // Load select sound if not already loaded
        if (!this.cache.audio.exists('select_sound')) {
            this.load.audio('select_sound', './assets/audio/select.mp3');
            this.load.start();
        }

        // HUD Background - top bar
        this.hudBg = this.add.rectangle(0, 0, 350, 50, 0x000000, 0.85);
        this.hudBg.setOrigin(0, 0);
        this.hudBg.setStrokeStyle(2, 0xf5a623);
        this.hudBg.setScrollFactor(0);
        this.hudBg.setDepth(1000);

        // Level Name
        this.levelNameText = this.add.text(10, 8, '🦟 Carregando...', {
            fontSize: '14px',
            color: '#f5a623',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(1001);

        // Stats Row
        this.statsText = this.add.text(10, 28, '⏱️ 0s  |  🔄 0  |  🗑️ 0/0', {
            fontSize: '12px',
            color: '#fff'
        }).setScrollFactor(0).setDepth(1001);

        // Menu Button (top right)
        this.menuBtn = this.add.text(this.cameras.main.width - 10, 15, '☰ Menu', {
            fontSize: '14px',
            color: '#fff',
            backgroundColor: '#ff6b6b',
            padding: { x: 10, y: 6 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
            .setScrollFactor(0).setDepth(1001);

        this.menuBtn.on('pointerdown', () => {
            if (this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.scene.stop('LevelScene');
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });

        // Instructions (bottom)
        this.instructionText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 12,
            '👆 Clique no robô para programar', {
            fontSize: '13px',
            color: '#aaa',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        // Setup camera overlay handlers
        this.setupCameraHandlers();
    }

    setupCameraHandlers() {
        const overlay = document.getElementById('camera-overlay');
        const btnCapture = document.getElementById('btn-capture');
        const btnClose = document.getElementById('btn-close');

        if (!overlay || !btnCapture || !btnClose) {
            console.error("Camera overlay elements not found");
            return;
        }

        // Remove old handlers to prevent duplicates
        btnCapture.onclick = null;
        btnClose.onclick = null;

        btnCapture.onclick = () => {
            const commands = this.vision.capture();
            console.log("Captured Commands:", commands);

            overlay.classList.add('hidden');
            this.instructionText.setVisible(true);

            const levelScene = this.scene.get('LevelScene');
            if (levelScene && levelScene.executeCommands) {
                levelScene.executeCommands(commands);
            }
        };

        btnClose.onclick = () => {
            this.vision.stopCamera();
            overlay.classList.add('hidden');
            this.instructionText.setVisible(true);
        };
    }

    openCamera() {
        const overlay = document.getElementById('camera-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.vision.startCamera();
            this.instructionText.setVisible(false);
        }
    }

    updateLevelInfo(name, totalCollectibles) {
        this.levelNameText.setText(`🦟 ${name}`);
        this.totalCollectibles = totalCollectibles;
    }

    updateHUD(time, attempts, collected, total) {
        this.statsText.setText(`⏱️ ${time}s  |  🔄 ${attempts}  |  🗑️ ${collected}/${total}`);
    }
}
