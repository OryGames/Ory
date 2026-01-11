/**
 * Ory: Caça Dengue - Robot Coding Adventure
 * Main Game Configuration
 */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, LevelScene, LevelCompleteScene, UIScene]
};

// Initialize Game
window.onload = () => {
    console.log("🦟 Starting Ory: Caça Dengue...");
    const game = new Phaser.Game(config);
};
