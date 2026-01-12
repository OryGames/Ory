/**
 * SplashScene - OryGames company splash screen (5 seconds)
 */
class SplashScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SplashScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        // Splash image
        this.splash = this.add.image(width / 2, height / 2, 'orygames_splash');

        // Scale to fit (show full width without stretching)
        const scaleX = width / this.splash.width;
        const scaleY = height / this.splash.height;
        this.splash.setScale(Math.min(scaleX, scaleY));

        // Fade in
        this.splash.setAlpha(0);
        this.tweens.add({
            targets: this.splash,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });

        // After 5 seconds, transition to InfoScene
        this.time.delayedCall(3000, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('InfoScene');
            });
        });

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;

        if (this.splash) {
            this.splash.setPosition(width / 2, height / 2);
            const scaleX = width / this.splash.width;
            const scaleY = height / this.splash.height;
            this.splash.setScale(Math.min(scaleX, scaleY));
        }
    }
}
