/**
 * TitleScene - Splash/Start Screen
 * Supports both landscape and portrait orientations
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    // Assets loaded by PreloaderScene

    create() {
        const { width, height } = this.scale;

        // Create both backgrounds, show the appropriate one
        this.bgLandscape = this.add.image(width / 2, height / 2, 'splash_landscape');
        this.bgPortrait = this.add.image(width / 2, height / 2, 'splash_portrait');

        // Dark overlay at bottom for button area
        this.overlay = this.add.rectangle(width / 2, height - 80, width, 200, 0x000000, 0.5);

        // Game Title
        this.title = this.add.text(width / 2, height * 0.12, '', {
            fontSize: Math.min(width * 0.08, 48) + 'px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.subtitle = this.add.text(width / 2, height * 0.20, '', {
            fontSize: Math.min(width * 0.04, 24) + 'px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Store button dimensions for resize
        this.btnWidth = Math.min(width * 0.6, 300);
        this.btnHeight = 70;
        this.btnY = height - 100;

        // Button background
        this.btnBg = this.add.graphics();

        // Button glow effect
        this.btnGlow = this.add.graphics();

        // Button text
        this.btnText = this.add.text(width / 2, this.btnY, 'JOGAR', {
            fontSize: '32px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#000000'
        }).setOrigin(0.5);

        // Make button interactive
        this.hitArea = this.add.rectangle(width / 2, this.btnY, this.btnWidth, this.btnHeight, 0x000000, 0);
        this.hitArea.setInteractive({ useHandCursor: true });

        this.hitArea.on('pointerover', () => {
            this.drawButton(0xffd54f);
            this.btnText.setScale(1.05);
        });

        this.hitArea.on('pointerout', () => {
            this.drawButton(0xf5a623);
            this.btnText.setScale(1);
        });

        this.hitArea.on('pointerdown', () => {
            if (this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.btnText.setScale(0.95);
        });

        this.hitArea.on('pointerup', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });

        // Options button (below JOGAR)
        this.optBtnWidth = Math.min(width * 0.45, 200);
        this.optBtnHeight = 50;
        this.optBtnY = this.btnY + 80;

        this.optBtnBg = this.add.graphics();
        this.optBtnGlow = this.add.graphics();

        this.optBtnText = this.add.text(width / 2, this.optBtnY, '⚙️ OPÇÕES', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#f5a623',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.optHitArea = this.add.rectangle(width / 2, this.optBtnY, this.optBtnWidth, this.optBtnHeight, 0x000000, 0);
        this.optHitArea.setInteractive({ useHandCursor: true });

        this.optHitArea.on('pointerover', () => {
            this.drawOptionsButton(0x3d2f4d);
            this.optBtnText.setScale(1.05);
            this.optBtnText.setColor('#ffc857');
        });

        this.optHitArea.on('pointerout', () => {
            this.drawOptionsButton(0x2d1f3d);
            this.optBtnText.setScale(1);
            this.optBtnText.setColor('#f5a623');
        });

        this.optHitArea.on('pointerdown', () => {
            if (this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.optBtnText.setScale(0.95);
        });

        this.optHitArea.on('pointerup', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('OptionsScene');
            });
        });

        // Pulsing animation on button glow
        this.tweens.add({
            targets: this.btnGlow,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Initial layout
        this.updateLayout();

        // Fade in effect
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Start background music (stop any existing music first)
        this.sound.stopByKey('music_levelselect');
        this.sound.stopByKey('music_level');
        this.sound.stopByKey('music_cutscene');
        this.sound.stopByKey('music_endgame');
        if (!this.sound.get('music_title')?.isPlaying) {
            const settings = this.loadSettings();
            const music = this.sound.add('music_title', { loop: true, volume: 0.3 });
            music.setMute(!settings.musicEnabled);
            music.play();
        }

        // Handle resize
        this.scale.on('resize', this.handleResize, this);

        // Display version in bottom right corner
        const version = this.game.config.gameVersion || 'v1.0';
        this.versionText = this.add.text(width - 10, height - 10, version, {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff66'
        }).setOrigin(1, 1).setDepth(50);

        // Show version warning if alpha or beta //
        this.showVersionWarning();
    }

    showVersionWarning() {
        const version = this.game.config.gameVersion || '';
        const isTestVersion = version.toLowerCase().includes('alpha') || version.toLowerCase().includes('beta');

        if (isTestVersion) {
            const { width } = this.scale;

            // Warning banner background
            this.warningBg = this.add.graphics();
            this.warningBg.fillStyle(0xff6b00, 0.95);
            this.warningBg.fillRoundedRect(10, 70, width - 20, 50, 10);
            this.warningBg.lineStyle(2, 0xffcc00, 1);
            this.warningBg.strokeRoundedRect(10, 70, width - 20, 50, 10);
            this.warningBg.setDepth(200);

            // Warning text
            this.warningText = this.add.text(width / 2, 95, `⚠️ VERSÃO DE TESTES (${version})`, {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(201);

            // Subtext
            this.warningSubtext = this.add.text(width / 2, 110, 'Esta versão pode conter bugs e está em desenvolvimento', {
                fontSize: '10px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffffcc'
            }).setOrigin(0.5).setDepth(201);
        }
    }

    drawButton(color = 0xf5a623) {
        const { width } = this.scale;

        this.btnBg.clear();
        this.btnBg.fillStyle(color, 1);
        this.btnBg.fillRoundedRect(width / 2 - this.btnWidth / 2, this.btnY - this.btnHeight / 2, this.btnWidth, this.btnHeight, 16);

        this.btnGlow.clear();
        this.btnGlow.lineStyle(4, 0xffd54f, 0.8);
        this.btnGlow.strokeRoundedRect(width / 2 - this.btnWidth / 2, this.btnY - this.btnHeight / 2, this.btnWidth, this.btnHeight, 16);
    }

    drawOptionsButton(color = 0x2d1f3d) {
        const { width } = this.scale;

        this.optBtnBg.clear();
        this.optBtnBg.fillStyle(color, 0.95);
        this.optBtnBg.fillRoundedRect(width / 2 - this.optBtnWidth / 2, this.optBtnY - this.optBtnHeight / 2, this.optBtnWidth, this.optBtnHeight, 12);

        this.optBtnGlow.clear();
        this.optBtnGlow.lineStyle(2, 0xf5a623, 0.8);
        this.optBtnGlow.strokeRoundedRect(width / 2 - this.optBtnWidth / 2, this.optBtnY - this.optBtnHeight / 2, this.optBtnWidth, this.optBtnHeight, 12);
    }

    updateLayout() {
        const { width, height } = this.scale;
        const isPortrait = height > width;

        // Show appropriate background
        this.bgLandscape.setVisible(!isPortrait);
        this.bgPortrait.setVisible(isPortrait);

        // Position and scale backgrounds to cover screen
        const activeBg = isPortrait ? this.bgPortrait : this.bgLandscape;
        activeBg.setPosition(width / 2, height / 2);

        // Scale to cover (crop edges, don't stretch)
        const scaleX = width / activeBg.width;
        const scaleY = height / activeBg.height;
        const scale = Math.max(scaleX, scaleY);
        activeBg.setScale(scale);

        // Also scale the hidden one for smooth transitions
        const hiddenBg = isPortrait ? this.bgLandscape : this.bgPortrait;
        hiddenBg.setPosition(width / 2, height / 2);
        const hScaleX = width / hiddenBg.width;
        const hScaleY = height / hiddenBg.height;
        hiddenBg.setScale(Math.max(hScaleX, hScaleY));

        // Update overlay
        this.overlay.setPosition(width / 2, height - 80);
        this.overlay.setSize(width, 200);

        // Update title
        this.title.setPosition(width / 2, height * 0.12);
        this.title.setFontSize(Math.min(width * 0.08, 48));

        // Update subtitle
        this.subtitle.setPosition(width / 2, height * 0.20);
        this.subtitle.setFontSize(Math.min(width * 0.04, 24));

        // Update button
        this.btnWidth = Math.min(width * 0.6, 300);
        this.btnY = height - 130;
        this.btnText.setPosition(width / 2, this.btnY);
        this.hitArea.setPosition(width / 2, this.btnY);
        this.hitArea.setSize(this.btnWidth, this.btnHeight);
        this.drawButton();

        // Update options button
        this.optBtnWidth = Math.min(width * 0.45, 200);
        this.optBtnY = this.btnY + 70;
        this.optBtnText.setPosition(width / 2, this.optBtnY);
        this.optHitArea.setPosition(width / 2, this.optBtnY);
        this.optHitArea.setSize(this.optBtnWidth, this.optBtnHeight);
        this.drawOptionsButton();
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

    handleResize(gameSize) {
        this.updateLayout();
    }
}
