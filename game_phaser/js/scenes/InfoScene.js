/**
 * InfoScene - Shows how to get game pieces, click to continue
 */
class InfoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InfoScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Background image
        this.bg = this.add.image(width / 2, height / 2, 'info_bg');

        // Scale to fit (show full width without stretching)
        const scaleX = width / this.bg.width;
        const scaleY = height / this.bg.height;
        this.bg.setScale(Math.min(scaleX, scaleY));

        // "Click to continue" text at bottom
        this.continueText = this.add.text(width / 2, height - 40, '👆 Clique para continuar', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(100);

        // Pulsing animation on continue text
        this.tweens.add({
            targets: this.continueText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Fade in
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Click anywhere to continue
        this.input.on('pointerdown', () => {
            // Play select sound if available
            const settings = this.loadSettings();
            if (settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }

            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('TitleScene');
            });
        });

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;

        if (this.bg) {
            this.bg.setPosition(width / 2, height / 2);
            const scaleX = width / this.bg.width;
            const scaleY = height / this.bg.height;
            this.bg.setScale(Math.min(scaleX, scaleY));
        }

        if (this.continueText) {
            this.continueText.setPosition(width / 2, height - 40);
        }
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
