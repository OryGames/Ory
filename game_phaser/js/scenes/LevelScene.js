class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    init(data) {
        this.levelId = data.levelId || 1;
        this.attempts = 0;
        this.startTime = null;
        this.collected = 0;
        this.levelData = null;
    }

    preload() {
        this.load.json(`level${this.levelId}`, `./assets/levels/level${this.levelId}.json`);

        this.load.spritesheet('tileset', './assets/sprites/tile.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet('collectibles', './assets/sprites/collectibles.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.image('robot', './assets/sprites/robot.png');
    }

    create() {
        this.levelData = this.cache.json.get(`level${this.levelId}`);

        if (!this.levelData) {
            console.error("Failed to load level data");
            return;
        }

        this.tileSize = 48;
        this.collectibles = [];

        // Calculate world size
        const worldWidth = this.levelData.gridWidth * this.tileSize;
        const worldHeight = this.levelData.gridHeight * this.tileSize;

        // Set world bounds
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Draw Tiles
        this.drawTilemap();

        // Spawn Collectibles
        this.spawnCollectibles();

        // Spawn Robot
        const start = this.levelData.robotStart;
        this.robot = new Robot(this, start.x, start.y, start.direction);

        // Make Robot Interactive
        this.robot.sprite.setInteractive();
        this.robot.sprite.on('pointerdown', () => {
            this.attempts++;
            // Call UIScene directly instead of events
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.openCamera) {
                uiScene.openCamera();
            }
        });

        // Setup Camera to follow Robot
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.robot.sprite, true, 0.1, 0.1);

        // Start UIScene and update it
        this.scene.launch('UIScene');

        // Wait a frame then update UI
        this.time.delayedCall(100, () => {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.updateLevelInfo) {
                uiScene.updateLevelInfo(this.levelData.name, this.levelData.collectibles.length);
            }
        });

        // Start Timer
        this.startTime = Date.now();
    }

    update() {
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

            // Direct call to UIScene
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.updateHUD) {
                uiScene.updateHUD(elapsed, this.attempts, this.collected, this.levelData.collectibles.length);
            }
        }
    }

    drawTilemap() {
        const tiles = this.levelData.tiles;

        const tileFrameMap = {
            0: [0, 1, 2, 10],
            1: [40, 41, 42, 44],
            2: [54, 55],
            3: [25, 26, 35, 36]
        };

        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                const tileType = tiles[y][x];
                const posX = x * this.tileSize + this.tileSize / 2;
                const posY = y * this.tileSize + this.tileSize / 2;

                const variants = tileFrameMap[tileType] || [0];
                const frame = variants[Math.floor(Math.random() * variants.length)];

                const tile = this.add.image(posX, posY, 'tileset', frame);
                tile.setDisplaySize(this.tileSize, this.tileSize);
            }
        }
    }

    spawnCollectibles() {
        const frameMap = { 'tire': 0, 'bottle': 1, 'bag': 2 };

        this.levelData.collectibles.forEach(item => {
            const x = item.x * this.tileSize + this.tileSize / 2;
            const y = item.y * this.tileSize + this.tileSize / 2;

            const frame = frameMap[item.type] ?? 0;
            const sprite = this.add.image(x, y, 'collectibles', frame);
            sprite.setDisplaySize(36, 36);
            sprite.setDepth(50);

            sprite.gridX = item.x;
            sprite.gridY = item.y;
            sprite.collected = false;

            this.tweens.add({
                targets: sprite,
                y: y - 4,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.collectibles.push(sprite);
        });
    }

    checkCollision(gridX, gridY) {
        const tiles = this.levelData.tiles;
        if (gridY < 0 || gridY >= tiles.length || gridX < 0 || gridX >= tiles[0].length) {
            return false;
        }
        const tile = tiles[gridY][gridX];
        return tile !== 2 && tile !== 3;
    }

    collectAtPosition(gridX, gridY) {
        const item = this.collectibles.find(c => c.gridX === gridX && c.gridY === gridY && !c.collected);
        if (item) {
            item.collected = true;
            this.collected++;

            this.tweens.add({
                targets: item,
                scale: 1.5,
                alpha: 0,
                y: item.y - 30,
                duration: 300,
                onComplete: () => item.setVisible(false)
            });

            if (this.collected === this.levelData.collectibles.length) {
                this.time.delayedCall(500, () => this.levelComplete());
            }
        }
    }

    async executeCommands(commands) {
        commands = commands.filter(c => c !== 'inicio');
        await Interpreter.execute(commands, this.robot, this);

        if (this.collected === this.levelData.collectibles.length) {
            this.levelComplete();
        }
    }

    levelComplete() {
        const timeUsed = Math.floor((Date.now() - this.startTime) / 1000);
        const stars = this.calculateStars(timeUsed, this.attempts);

        // Stop UIScene before transition
        this.scene.stop('UIScene');

        this.scene.start('LevelCompleteScene', {
            levelId: this.levelId,
            stars: stars,
            timeUsed: timeUsed,
            attempts: this.attempts,
            collected: this.collected,
            total: this.levelData.collectibles.length
        });
    }

    calculateStars(time, attempts) {
        const sc = this.levelData.stars;
        if (time <= sc.time[2] && attempts <= sc.attempts[2]) return 3;
        if (time <= sc.time[1] && attempts <= sc.attempts[1]) return 2;
        if (time <= sc.time[0] && attempts <= sc.attempts[0]) return 1;
        return 0;
    }
}
