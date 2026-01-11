class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
        this.tileSize = 64;
    }

    preload() {
        // We will use Phaser Graphics for now, no assets needed yet
    }

    create() {
        // 1. Draw Grid
        this.drawGrid();

        // 2. Create Robot (Entity) at (2, 2)
        // Grid coordinates: x=2, y=2
        this.robot = new Robot(this, 2, 2);

        // 3. Create Goal/Flag at (8, 5)
        this.goal = this.add.rectangle(
            8 * this.tileSize + this.tileSize / 2,
            5 * this.tileSize + this.tileSize / 2,
            40, 40, 0xffd700
        ); // Gold color

        this.add.text(this.goal.x - 10, this.goal.y - 10, 'F', { color: 'black' });

        // Input Listener for interactions
        // Click on Robot to open camera?
        this.robot.sprite.setInteractive();
        this.robot.sprite.on('pointerdown', () => {
            // Emit event to UI Scene to open Camera
            this.scene.get('UIScene').events.emit('openCamera');
        });

        // Debug Text
        this.add.text(10, 10, 'Click Robot to Scan Code', { fill: '#fff' });
    }

    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444, 1); // Gray lines

        // Draw vertical lines
        for (let x = 0; x <= this.game.config.width; x += this.tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.game.config.height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.game.config.height; y += this.tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.game.config.width, y);
        }

        graphics.strokePath();
    }
    async executeCommands(commands) {
        // Run Interpreter
        await Interpreter.execute(commands, this.robot);

        // Check Win Condition
        const dist = Phaser.Math.Distance.Between(
            this.robot.sprite.x, this.robot.sprite.y,
            this.goal.x, this.goal.y
        );

        if (dist < 32) {
            alert("YOU WIN!");
        }
    }
}
