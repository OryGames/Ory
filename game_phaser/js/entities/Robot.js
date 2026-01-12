class Robot {
    constructor(scene, gridX, gridY, direction = 2) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = scene.tileSize || 48;
        this.direction = direction; // 0=up, 1=right, 2=down, 3=left
        this.isMoving = false;
        this.walkFrame = 0;
        this.idleFrame = 0;
        this.idleTimer = null;

        const screenX = this.gridX * this.tileSize + this.tileSize / 2;
        const screenY = this.gridY * this.tileSize + this.tileSize / 2;

        // Direction to texture mapping
        // idle = standing still texture, normal = alternate idle frame
        this.dirTextures = {
            0: { idle: 'player_up_idle', normal: 'player_up', walk: ['player_up', 'player_up_1'] },
            1: { idle: 'player_right_idle', normal: 'player_right', walk: ['player_right', 'player_right_1'] },
            2: { idle: 'player_down_idle', normal: 'player_down', walk: ['player_down', 'player_down_1'] },
            3: { idle: 'player_right_idle', normal: 'player_right', walk: ['player_right', 'player_right_1'], flipX: true }
        };

        // Create sprite with initial texture
        this.sprite = scene.add.image(screenX, screenY, this.getIdleTexture());
        this.sprite.setDisplaySize(this.tileSize * 0.9, this.tileSize * 1.8);
        this.sprite.setOrigin(0.5, 0.75); // Anchor lower for proper positioning
        this.sprite.setDepth(100);

        // Apply initial flip for left direction
        this.updateSpriteDirection();

        // Start idle animation
        this.startIdleAnimation();

        // Make interactive
        this.sprite.setInteractive({ useHandCursor: true });
    }

    getIdleTexture() {
        return this.dirTextures[this.direction].idle;
    }

    getNormalTexture() {
        return this.dirTextures[this.direction].normal;
    }

    getWalkTexture() {
        const textures = this.dirTextures[this.direction].walk;
        return textures[this.walkFrame % textures.length];
    }

    startIdleAnimation() {
        this.stopIdleAnimation();
        this.idleFrame = 0;
        const flip = this.dirTextures[this.direction].flipX || false;

        this.idleTimer = this.scene.time.addEvent({
            delay: 500, // Alternate every 500ms
            callback: () => {
                if (!this.isMoving) {
                    this.idleFrame++;
                    const texture = this.idleFrame % 2 === 0 ? this.getIdleTexture() : this.getNormalTexture();
                    this.sprite.setTexture(texture);
                    this.sprite.setFlipX(flip);
                }
            },
            loop: true
        });
    }

    stopIdleAnimation() {
        if (this.idleTimer) {
            this.idleTimer.destroy();
            this.idleTimer = null;
        }
    }

    updateSpriteDirection() {
        const dir = this.dirTextures[this.direction];
        this.sprite.setTexture(dir.idle);
        this.sprite.setFlipX(dir.flipX || false);
        // Restart idle animation with new direction
        this.startIdleAnimation();
    }

    face(direction) {
        this.direction = direction;
        this.updateSpriteDirection();
    }

    turnRight() {
        this.direction = (this.direction + 1) % 4;
        this.updateSpriteDirection();
    }

    turnLeft() {
        this.direction = (this.direction - 1 + 4) % 4;
        this.updateSpriteDirection();
    }

    async moveForward(steps = 1) {
        if (this.isMoving) return;
        this.isMoving = true;

        // Start movement sound loop
        this.startMovementSound();

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

            // Start walk animation
            const walkAnim = this.startWalkAnimation();

            await new Promise(resolve => {
                this.scene.tweens.add({
                    targets: this.sprite,
                    x: screenX,
                    y: screenY,
                    duration: 300,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        this.stopWalkAnimation(walkAnim);
                        resolve();
                    }
                });
            });

            this.scene.collectAtPosition(this.gridX, this.gridY);
        }

        // Stop movement sound
        this.stopMovementSound();
        this.isMoving = false;
    }

    startMovementSound() {
        const settings = this.loadSettings();
        if (settings.soundEnabled && this.scene.cache.audio.exists('mov_sound')) {
            if (!this.movSound) {
                this.movSound = this.scene.sound.add('mov_sound', { loop: true, volume: 0.85 });
            }
            if (!this.movSound.isPlaying) {
                this.movSound.play();
            }
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

    stopMovementSound() {
        if (this.movSound && this.movSound.isPlaying) {
            this.movSound.stop();
        }
    }

    startWalkAnimation() {
        const flip = this.dirTextures[this.direction].flipX || false;
        this.walkFrame = 0;

        return this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.walkFrame++;
                this.sprite.setTexture(this.getWalkTexture());
                this.sprite.setFlipX(flip);
            },
            loop: true
        });
    }

    stopWalkAnimation(timerEvent) {
        if (timerEvent) timerEvent.destroy();
        this.sprite.setTexture(this.getIdleTexture());
        this.sprite.setFlipX(this.dirTextures[this.direction].flipX || false);
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

        // Jump animation
        await new Promise(resolve => {
            // Jump up phase
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 40,
                scaleX: 1.1,
                scaleY: 0.9,
                duration: 150,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    // Arc and land phase
                    this.scene.tweens.add({
                        targets: this.sprite,
                        x: screenX,
                        y: screenY,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 250,
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
