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

        const hudWidth = 320;
        const hudHeight = 54;
        const hudX = 12;
        const hudY = 10;
        const cornerRadius = 14;

        // HUD Background - elegant rounded container with glassmorphism
        this.hudBg = this.add.graphics();
        this.hudBg.fillStyle(0x1a1a2e, 0.9);
        this.hudBg.fillRoundedRect(hudX, hudY, hudWidth, hudHeight, cornerRadius);
        this.hudBg.lineStyle(2, 0xf5a623, 0.8);
        this.hudBg.strokeRoundedRect(hudX, hudY, hudWidth, hudHeight, cornerRadius);
        this.hudBg.setScrollFactor(0);
        this.hudBg.setDepth(1000);

        // Inner glow effect
        this.hudGlow = this.add.graphics();
        this.hudGlow.lineStyle(1, 0xf5a623, 0.3);
        this.hudGlow.strokeRoundedRect(hudX + 2, hudY + 2, hudWidth - 4, hudHeight - 4, cornerRadius - 2);
        this.hudGlow.setScrollFactor(0);
        this.hudGlow.setDepth(1000);

        // Level Name
        this.levelNameText = this.add.text(hudX + 14, hudY + 10, '🦟 Carregando...', {
            fontSize: '14px',
            color: '#f5a623',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setScrollFactor(0).setDepth(1001);

        // Stats Row with better styling
        this.statsText = this.add.text(hudX + 14, hudY + 30, '⏱️ 0s  |  🔄 0  |  🗑️ 0/0', {
            fontSize: '12px',
            color: '#e0e0e0',
            fontFamily: 'Arial, sans-serif'
        }).setScrollFactor(0).setDepth(1001);

        // Exit Button (top right) - elegant rounded design
        const btnWidth = 80;
        const btnHeight = 36;
        const btnX = this.cameras.main.width - btnWidth - 12;
        const btnY = hudY + (hudHeight - btnHeight) / 2;
        const btnRadius = 10;

        // Button background
        this.exitBtnBg = this.add.graphics();
        this.exitBtnBg.fillStyle(0x2d1f3d, 0.95);
        this.exitBtnBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
        this.exitBtnBg.lineStyle(2, 0xf5a623, 0.9);
        this.exitBtnBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
        this.exitBtnBg.setScrollFactor(0);
        this.exitBtnBg.setDepth(1000);

        // Button text
        this.menuBtn = this.add.text(btnX + btnWidth / 2, btnY + btnHeight / 2, '← Sair', {
            fontSize: '14px',
            color: '#f5a623',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        // Interactive zone for the button
        this.exitBtnZone = this.add.zone(btnX + btnWidth / 2, btnY + btnHeight / 2, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(1002);

        // Hover effects
        this.exitBtnZone.on('pointerover', () => {
            this.exitBtnBg.clear();
            this.exitBtnBg.fillStyle(0x3d2f4d, 0.98);
            this.exitBtnBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            this.exitBtnBg.lineStyle(2, 0xffc857, 1);
            this.exitBtnBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            this.menuBtn.setColor('#ffc857');
        });

        this.exitBtnZone.on('pointerout', () => {
            this.exitBtnBg.clear();
            this.exitBtnBg.fillStyle(0x2d1f3d, 0.95);
            this.exitBtnBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            this.exitBtnBg.lineStyle(2, 0xf5a623, 0.9);
            this.exitBtnBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, btnRadius);
            this.menuBtn.setColor('#f5a623');
        });

        this.exitBtnZone.on('pointerdown', () => {
            const settings = this.loadSettings();
            if (settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.scene.stop('LevelScene');
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
        });

        // Instructions (bottom) - elegant rounded pill
        const instrBg = this.add.graphics();
        const instrText = '👆 Clique no robô para programar';
        const instrPadX = 16;
        const instrPadY = 8;

        this.instructionText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 20,
            instrText, {
            fontSize: '13px',
            color: '#e0e0e0',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        const instrWidth = this.instructionText.width + instrPadX * 2;
        const instrHeight = this.instructionText.height + instrPadY * 2;
        const instrX = (this.cameras.main.width - instrWidth) / 2;
        const instrY = this.cameras.main.height - 20 - instrHeight / 2;

        instrBg.fillStyle(0x1a1a2e, 0.85);
        instrBg.fillRoundedRect(instrX, instrY, instrWidth, instrHeight, 12);
        instrBg.lineStyle(1, 0xf5a623, 0.5);
        instrBg.strokeRoundedRect(instrX, instrY, instrWidth, instrHeight, 12);
        instrBg.setScrollFactor(0);
        instrBg.setDepth(1000);

        this.instructionBg = instrBg;

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

    loadSettings() {
        const defaults = {
            musicEnabled: true,
            soundEnabled: true,
            gridEnabled: false
        };

        try {
            const saved = localStorage.getItem('ory_settings');
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }

        return defaults;
    }
}
