/**
 * Ory: Caça Dengue - Robot Coding Adventure
 * Main Game Configuration (Full Screen Responsive)
 */

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloaderScene, SplashScene, InfoScene, TitleScene, OptionsScene, MenuScene, CutsceneScene, LevelScene, LevelCompleteScene, CreditsScene, UIScene],
    input: {
        activePointers: 3
    },
    version: 'alpha-0.1'
};

// Initialize Game
window.onload = () => {
    console.log("🦟 Starting Ory: Caça Dengue...");
    const game = new Phaser.Game(config);
};
