class Robot {
    constructor(scene, gridX, gridY, direction = 1) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = scene.tileSize || 48;
        this.direction = direction;
        this.isMoving = false;

        const screenX = this.gridX * this.tileSize + this.tileSize / 2;
        const screenY = this.gridY * this.tileSize + this.tileSize / 2;

        // Create sprite from loaded image
        this.sprite = scene.add.image(screenX, screenY, 'robot');
        this.sprite.setDisplaySize(42, 42);
        this.sprite.setDepth(100);

        // Apply initial rotation
        this.updateRotation(false);

        // Make interactive
        this.sprite.setInteractive({ useHandCursor: true });
    }

    updateRotation(animate = true) {
        const angles = [-90, 0, 90, 180];
        const targetAngle = angles[this.direction];

        if (animate) {
            this.scene.tweens.add({
                targets: this.sprite,
                angle: targetAngle,
                duration: 200,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.sprite.angle = targetAngle;
        }
    }

    face(direction) {
        this.direction = direction;
        this.updateRotation();
    }

    turnRight() {
        this.direction = (this.direction + 1) % 4;
        this.updateRotation();
    }

    turnLeft() {
        this.direction = (this.direction - 1 + 4) % 4;
        this.updateRotation();
    }

    async moveForward(steps = 1) {
        if (this.isMoving) return;
        this.isMoving = true;

        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];

        for (let i = 0; i < steps; i++) {
            const nextX = this.gridX + dx[this.direction];
            const nextY = this.gridY + dy[this.direction];

            if (!this.scene.checkCollision(nextX, nextY)) {
                console.log("Blocked at", nextX, nextY);
                break;
            }

            this.gridX = nextX;
            this.gridY = nextY;

            const screenX = this.gridX * this.tileSize + this.tileSize / 2;
            const screenY = this.gridY * this.tileSize + this.tileSize / 2;

            await new Promise(resolve => {
                this.scene.tweens.add({
                    targets: this.sprite,
                    x: screenX,
                    y: screenY,
                    duration: 250,
                    ease: 'Sine.easeInOut',
                    onComplete: resolve
                });
            });

            this.scene.collectAtPosition(this.gridX, this.gridY);
        }

        this.isMoving = false;
    }

    async jump(steps = 1) {
        if (this.isMoving) return;
        this.isMoving = true;

        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];

        const targetX = this.gridX + dx[this.direction] * (steps + 1);
        const targetY = this.gridY + dy[this.direction] * (steps + 1);

        if (!this.scene.checkCollision(targetX, targetY)) {
            console.log("Cannot land at", targetX, targetY);
            this.isMoving = false;
            return;
        }

        this.gridX = targetX;
        this.gridY = targetY;

        const screenX = this.gridX * this.tileSize + this.tileSize / 2;
        const screenY = this.gridY * this.tileSize + this.tileSize / 2;

        await new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 30,
                scaleX: 1.15,
                scaleY: 0.85,
                duration: 120,
                yoyo: false,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.sprite,
                        x: screenX,
                        y: screenY,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200,
                        ease: 'Sine.easeIn',
                        onComplete: resolve
                    });
                }
            });
        });

        this.scene.collectAtPosition(this.gridX, this.gridY);
        this.isMoving = false;
    }
}
