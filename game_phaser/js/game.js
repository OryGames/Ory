/**
 * Ory: Robot Coding Adventure
 * Main Game Configuration
 */

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container', // Attach to div
    backgroundColor: '#1a1a1a',
    pixelArt: false, // Ensure smooth scaling for vector-like assets if any
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down
            debug: false
        }
    },
    scene: [LevelScene, UIScene] // We will define these classes next
};

// Initialize Game (after window load to be safe)
window.onload = () => {
    // Check if other scripts loaded (VisionHandler, etc)
    console.log("Starting Ory Game...");
    const game = new Phaser.Game(config);
};
