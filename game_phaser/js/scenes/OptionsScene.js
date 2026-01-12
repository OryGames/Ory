/**
 * OptionsScene - Game Settings Screen
 * Toggle music, sounds, grid overlay, and clear progress
 */
class OptionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OptionsScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Load settings from localStorage
        this.settings = this.loadSettings();

        // Background image
        this.bg = this.add.image(width / 2, height / 2, 'options_bg');
        const scaleX = width / this.bg.width;
        const scaleY = height / this.bg.height;
        this.bg.setScale(Math.max(scaleX, scaleY));

        // Dark overlay for readability
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

        // Title
        this.title = this.add.text(width / 2, 60, '⚙️ Opções', {
            fontSize: '32px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#f5a623',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Create toggle buttons
        this.toggles = [];
        const startY = 150;
        const spacing = 80;

        this.createToggle('🎵 Música', 'musicEnabled', startY);
        this.createToggle('🔊 Sons', 'soundEnabled', startY + spacing);
        this.createToggle('📐 Grade', 'gridEnabled', startY + spacing * 2);

        // Clear Data button (special - destructive action)
        this.createClearDataButton(startY + spacing * 3 + 30);

        // Back button
        this.createBackButton(height - 80);

        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
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

    saveSettings() {
        try {
            localStorage.setItem('ory_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    createToggle(label, settingKey, y) {
        const { width } = this.scale;
        const toggleWidth = 280;
        const toggleHeight = 56;
        const x = width / 2;
        const cornerRadius = 14;

        // Background container
        const bg = this.add.graphics();

        // Label text
        const labelText = this.add.text(x - 90, y, label, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Toggle switch background
        const switchWidth = 60;
        const switchHeight = 30;
        const switchX = x + 80;
        const switchY = y;
        const switchRadius = 15;

        const switchBg = this.add.graphics();
        const knob = this.add.graphics();

        const drawSwitch = (enabled) => {
            switchBg.clear();
            knob.clear();

            // Switch track
            switchBg.fillStyle(enabled ? 0x4caf50 : 0x555555, 1);
            switchBg.fillRoundedRect(switchX - switchWidth / 2, switchY - switchHeight / 2, switchWidth, switchHeight, switchRadius);
            switchBg.lineStyle(2, enabled ? 0x66bb6a : 0x777777, 1);
            switchBg.strokeRoundedRect(switchX - switchWidth / 2, switchY - switchHeight / 2, switchWidth, switchHeight, switchRadius);

            // Knob
            const knobX = enabled ? switchX + 14 : switchX - 14;
            knob.fillStyle(0xffffff, 1);
            knob.fillCircle(knobX, switchY, 11);
            knob.lineStyle(2, enabled ? 0x66bb6a : 0x777777, 1);
            knob.strokeCircle(knobX, switchY, 11);
        };

        // Draw background
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(x - toggleWidth / 2, y - toggleHeight / 2, toggleWidth, toggleHeight, cornerRadius);
        bg.lineStyle(2, 0xf5a623, 0.6);
        bg.strokeRoundedRect(x - toggleWidth / 2, y - toggleHeight / 2, toggleWidth, toggleHeight, cornerRadius);

        // Initial state
        drawSwitch(this.settings[settingKey]);

        // Interactive zone
        const zone = this.add.zone(x, y, toggleWidth, toggleHeight)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerdown', () => {
            if (this.settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }

            // Toggle the setting
            this.settings[settingKey] = !this.settings[settingKey];
            this.saveSettings();
            drawSwitch(this.settings[settingKey]);

            // Apply changes immediately
            this.applySettings(settingKey);
        });

        this.toggles.push({ bg, labelText, switchBg, knob, zone, settingKey });
    }

    applySettings(changedKey) {
        if (changedKey === 'musicEnabled') {
            // Mute or unmute all music
            const musicKeys = ['music_title', 'music_levelselect', 'music_level', 'music_cutscene', 'music_endgame'];
            musicKeys.forEach(key => {
                const music = this.sound.get(key);
                if (music) {
                    music.setMute(!this.settings.musicEnabled);
                }
            });
        }

        if (changedKey === 'soundEnabled') {
            // Sound effects are checked when played, no immediate action needed
        }

        // Grid setting is checked when LevelScene loads
    }

    createClearDataButton(y) {
        const { width } = this.scale;
        const btnWidth = 280;
        const btnHeight = 56;
        const x = width / 2;
        const cornerRadius = 14;

        const bg = this.add.graphics();

        const drawButton = (hover = false) => {
            bg.clear();
            bg.fillStyle(hover ? 0x7f2222 : 0x5f1a1a, 0.95);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, cornerRadius);
            bg.lineStyle(2, hover ? 0xff6666 : 0xcc4444, 0.9);
            bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, cornerRadius);
        };

        drawButton();

        const text = this.add.text(x, y, '🗑️ Limpar Progresso', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => drawButton(true));
        zone.on('pointerout', () => drawButton(false));

        zone.on('pointerdown', () => {
            if (this.settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.showConfirmDialog();
        });

        this.clearDataBtn = { bg, text, zone };
    }

    showConfirmDialog() {
        const { width, height } = this.scale;

        // Dim overlay
        this.dialogOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive();

        // Dialog box
        const dialogWidth = 300;
        const dialogHeight = 200;
        const dialogX = width / 2;
        const dialogY = height / 2;

        this.dialogBg = this.add.graphics();
        this.dialogBg.fillStyle(0x1a1a2e, 0.98);
        this.dialogBg.fillRoundedRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight, 16);
        this.dialogBg.lineStyle(2, 0xf5a623, 1);
        this.dialogBg.strokeRoundedRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight, 16);

        // Warning text
        this.dialogTitle = this.add.text(dialogX, dialogY - 60, '⚠️ Tem certeza?', {
            fontSize: '20px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#f5a623'
        }).setOrigin(0.5);

        this.dialogText = this.add.text(dialogX, dialogY - 20, 'Todo o progresso será\napagado permanentemente!', {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Confirm button
        const confirmBtnY = dialogY + 45;
        this.confirmBtnBg = this.add.graphics();
        this.confirmBtnBg.fillStyle(0x5f1a1a, 1);
        this.confirmBtnBg.fillRoundedRect(dialogX - 60, confirmBtnY - 18, 120, 36, 10);
        this.confirmBtnBg.lineStyle(2, 0xff4444, 1);
        this.confirmBtnBg.strokeRoundedRect(dialogX - 60, confirmBtnY - 18, 120, 36, 10);

        this.confirmBtnText = this.add.text(dialogX, confirmBtnY, 'APAGAR', {
            fontSize: '14px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.confirmBtnZone = this.add.zone(dialogX, confirmBtnY, 120, 36)
            .setInteractive({ useHandCursor: true });

        this.confirmBtnZone.on('pointerdown', () => {
            if (this.settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.clearAllData();
            this.closeDialog();
        });

        // Cancel button
        const cancelBtnY = dialogY + 45;
        const cancelBtnX = dialogX;

        // Reposition buttons side by side
        this.confirmBtnBg.clear();
        this.confirmBtnBg.fillStyle(0x5f1a1a, 1);
        this.confirmBtnBg.fillRoundedRect(dialogX - 130, confirmBtnY - 18, 100, 36, 10);
        this.confirmBtnBg.lineStyle(2, 0xff4444, 1);
        this.confirmBtnBg.strokeRoundedRect(dialogX - 130, confirmBtnY - 18, 100, 36, 10);
        this.confirmBtnText.setPosition(dialogX - 80, confirmBtnY);
        this.confirmBtnZone.setPosition(dialogX - 80, confirmBtnY);
        this.confirmBtnZone.setSize(100, 36);

        this.cancelBtnBg = this.add.graphics();
        this.cancelBtnBg.fillStyle(0x2d2d4d, 1);
        this.cancelBtnBg.fillRoundedRect(dialogX + 30, confirmBtnY - 18, 100, 36, 10);
        this.cancelBtnBg.lineStyle(2, 0x888888, 1);
        this.cancelBtnBg.strokeRoundedRect(dialogX + 30, confirmBtnY - 18, 100, 36, 10);

        this.cancelBtnText = this.add.text(dialogX + 80, confirmBtnY, 'CANCELAR', {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.cancelBtnZone = this.add.zone(dialogX + 80, confirmBtnY, 100, 36)
            .setInteractive({ useHandCursor: true });

        this.cancelBtnZone.on('pointerdown', () => {
            if (this.settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.closeDialog();
        });
    }

    closeDialog() {
        if (this.dialogOverlay) this.dialogOverlay.destroy();
        if (this.dialogBg) this.dialogBg.destroy();
        if (this.dialogTitle) this.dialogTitle.destroy();
        if (this.dialogText) this.dialogText.destroy();
        if (this.confirmBtnBg) this.confirmBtnBg.destroy();
        if (this.confirmBtnText) this.confirmBtnText.destroy();
        if (this.confirmBtnZone) this.confirmBtnZone.destroy();
        if (this.cancelBtnBg) this.cancelBtnBg.destroy();
        if (this.cancelBtnText) this.cancelBtnText.destroy();
        if (this.cancelBtnZone) this.cancelBtnZone.destroy();
    }

    clearAllData() {
        try {
            // Clear all level progress (ory_level_1 through ory_level_99)
            for (let i = 1; i <= 99; i++) {
                localStorage.removeItem(`ory_level_${i}`);
            }

            // Show feedback
            const { width, height } = this.scale;
            const feedback = this.add.text(width / 2, height / 2, '✅ Progresso apagado!', {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: '#4caf50',
                backgroundColor: '#000000aa',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setDepth(1000);

            this.time.delayedCall(1500, () => {
                feedback.destroy();
            });

        } catch (e) {
            console.warn('Failed to clear data:', e);
        }
    }

    createBackButton(y) {
        const { width } = this.scale;
        const btnWidth = 200;
        const btnHeight = 56;
        const x = width / 2;
        const cornerRadius = 14;

        const bg = this.add.graphics();

        const drawButton = (hover = false) => {
            bg.clear();
            bg.fillStyle(hover ? 0x3d2f4d : 0x2d1f3d, 0.95);
            bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, cornerRadius);
            bg.lineStyle(2, hover ? 0xffc857 : 0xf5a623, 0.9);
            bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, cornerRadius);
        };

        drawButton();

        const text = this.add.text(x, y, '← Voltar', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#f5a623',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            drawButton(true);
            text.setColor('#ffc857');
        });

        zone.on('pointerout', () => {
            drawButton(false);
            text.setColor('#f5a623');
        });

        zone.on('pointerdown', () => {
            if (this.settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('TitleScene');
            });
        });

        this.backBtn = { bg, text, zone };
    }

    handleResize(gameSize) {
        // Recreate the scene on resize for simplicity
        this.scene.restart();
    }
}
