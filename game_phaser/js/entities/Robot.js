class Robot {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = 64;

        // Current Heading (0: Up, 1: Right, 2: Down, 3: Left)
        this.direction = 1; // Start facing Right

        // Visuals
        const screenX = this.gridX * this.tileSize + this.tileSize / 2;
        const screenY = this.gridY * this.tileSize + this.tileSize / 2;

        // Body
        this.sprite = scene.add.container(screenX, screenY);

        const body = scene.add.rectangle(0, 0, 48, 48, 0x00d4bb);
        const eye = scene.add.rectangle(10, -10, 10, 10, 0x000000); // Visual indicator for "Forward"

        this.sprite.add([body, eye]);
        this.sprite.setSize(48, 48);

        // Ensure sprite faces correct initial direction (Right)
        // 0=Up, 1=Right(90), 2=Down(180), 3=Left(270)
        this.sprite.angle = 90;

        // Interactive for clicking
        this.sprite.setInteractive(new Phaser.Geom.Rectangle(-24, -24, 48, 48), Phaser.Geom.Rectangle.Contains);
    }

    face(direction) {
        this.direction = direction;
        this.updateRotation();
    }

    updateRotation() {
        const angles = [0, 90, 180, -90];
        this.scene.tweens.add({
            targets: this.sprite,
            angle: angles[this.direction],
            duration: 200
        });
    }

    turnRight() {
        this.direction = (this.direction + 1) % 4;
        this.updateRotation();
    }

    turnLeft() {
        this.direction = (this.direction - 1 + 4) % 4;
        this.updateRotation();
    }

    moveForward(steps = 1) {
        // Calculate target grid position
        let dx = 0;
        let dy = 0;

        if (this.direction === 0) dy = -1;
        if (this.direction === 1) dx = 1;
        if (this.direction === 2) dy = 1;
        if (this.direction === 3) dx = -1;

        const targetX = this.gridX + (dx * steps);
        const targetY = this.gridY + (dy * steps);

        // Update Grid Coords
        this.gridX = targetX;
        this.gridY = targetY;

        const screenX = this.gridX * this.tileSize + this.tileSize / 2;
        const screenY = this.gridY * this.tileSize + this.tileSize / 2;

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.sprite,
                x: screenX,
                y: screenY,
                duration: 500 * steps,
                onComplete: resolve
            });
        });
    }
}
