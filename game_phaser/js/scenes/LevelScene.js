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
        // First, load the level JSON to get tileset config
        this.load.json(`level${this.levelId}`, `./assets/levels/level${this.levelId}.json`);
    }

    // Use create to load assets after JSON is available
    create() {
        this.levelData = this.cache.json.get(`level${this.levelId}`);

        if (!this.levelData) {
            console.error("Failed to load level data");
            return;
        }

        // Get tileset config from level data, with defaults
        const tilesetConfig = this.levelData.tileset || {
            path: './assets/sprites/tile.png',
            cols: 11,
            rows: 7,
            tileSize: 32
        };

        this.tilesetCols = tilesetConfig.cols;
        this.tilesetTileSize = tilesetConfig.tileSize;

        // Load tileset dynamically - need to use loader in create
        this.load.spritesheet('tileset', tilesetConfig.path, {
            frameWidth: tilesetConfig.tileSize,
            frameHeight: tilesetConfig.tileSize
        });

        // Get collectibles sprite config from level data, with defaults
        const collectConfig = this.levelData.collectiblesSprite || {
            path: './assets/sprites/collectibles.png',
            cols: 3,
            rows: 1,
            frameSize: 64
        };

        this.collectCols = collectConfig.cols;
        this.collectFrameSize = collectConfig.frameSize;

        this.load.spritesheet('collectibles', collectConfig.path, {
            frameWidth: collectConfig.frameSize,
            frameHeight: collectConfig.frameSize
        });

        // Load character sprites from level config (default: boxbot)
        const charFolder = this.levelData.character || 'boxbot';
        const charPath = `./assets/sprites/characters/${charFolder}/`;

        // Clear existing character textures to force reload with new character
        const playerKeys = [
            'player_down_idle', 'player_down', 'player_down_1',
            'player_up_idle', 'player_up', 'player_up_1',
            'player_right_idle', 'player_right', 'player_right_1'
        ];
        playerKeys.forEach(key => {
            if (this.textures.exists(key)) {
                this.textures.remove(key);
            }
        });

        this.load.image('player_down_idle', charPath + 'player_down_idle.png');
        this.load.image('player_down', charPath + 'player_down.png');
        this.load.image('player_down_1', charPath + 'player_down_1.png');
        this.load.image('player_up_idle', charPath + 'player_up_idle.png');
        this.load.image('player_up', charPath + 'player_up.png');
        this.load.image('player_up_1', charPath + 'player_up_1.png');
        this.load.image('player_right_idle', charPath + 'player_right_idle.png');
        this.load.image('player_right', charPath + 'player_right.png');
        this.load.image('player_right_1', charPath + 'player_right_1.png');

        // Load movement audio
        this.load.audio('cmd_sound', './assets/audio/movement/cmd.mp3');
        this.load.audio('mov_sound', './assets/audio/movement/mov1.mp3');
        this.load.audio('get_sound', './assets/audio/movement/get.mp3');

        // Start loading and call setup when done
        this.load.once('complete', () => this.setupLevel());
        this.load.start();
    }

    setupLevel() {
        this.tileSize = 48;
        this.collectibles = [];

        // Build blocked map for quick lookup
        this.blockedMap = new Set();
        if (this.levelData.blocked) {
            this.levelData.blocked.forEach(b => {
                this.blockedMap.add(`${b.x},${b.y}`);
            });
        }

        const worldWidth = this.levelData.gridWidth * this.tileSize;
        const worldHeight = this.levelData.gridHeight * this.tileSize;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Draw Tiles
        this.drawTilemap();

        // Draw Goal if exists
        if (this.levelData.goalPosition) {
            const gx = this.levelData.goalPosition.x * this.tileSize + this.tileSize / 2;
            const gy = this.levelData.goalPosition.y * this.tileSize + this.tileSize / 2;
            this.goal = this.add.text(gx, gy, '🏁', { fontSize: '32px' }).setOrigin(0.5).setDepth(40);
        }

        // Spawn Collectibles
        this.spawnCollectibles();

        // Spawn Robot
        const start = this.levelData.robotStart;
        this.robot = new Robot(this, start.x, start.y, start.direction);

        this.robot.sprite.setInteractive();
        this.robot.sprite.on('pointerdown', () => {
            this.attempts++;
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.openCamera) {
                uiScene.openCamera();
            }
        });

        // Camera - always keep robot centered (no bounds = can center freely)
        this.cameras.main.startFollow(this.robot.sprite, true, 0.1, 0.1);
        this.cameras.main.centerOn(this.robot.sprite.x, this.robot.sprite.y);

        // Apply zoom for high-resolution desktops (>1280px width)
        const screenWidth = this.scale.width;
        if (screenWidth > 1280) {
            // Scale from 1.2x at 1280px to 1.5x at 1920px+
            const zoomFactor = Math.min(2.0, 1.5 + (screenWidth - 1280) / (1920 - 1280) * 0.3);
            this.cameras.main.setZoom(zoomFactor);
        }

        // Drag-to-pan camera feature
        this.setupCameraDrag();

        // UI
        this.scene.launch('UIScene');
        this.time.delayedCall(100, () => {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.updateLevelInfo) {
                uiScene.updateLevelInfo(this.levelData.name, this.levelData.collectibles.length);
            }
        });

        // Stop all background music when entering level
        this.sound.stopByKey('music_title');
        this.sound.stopByKey('music_levelselect');
        this.sound.stopByKey('music_cutscene');
        this.sound.stopByKey('music_level');

        // Play level-specific music if defined in level JSON
        // Example: "music": "./assets/audio/music/level1_theme.mp3"
        if (this.levelData.music) {
            this.load.audio('music_level', this.levelData.music);
            this.load.once('complete', () => {
                const music = this.sound.add('music_level', { loop: true, volume: 0.2 });
                // Apply music setting
                const settings = this.loadSettings();
                music.setMute(!settings.musicEnabled);
                music.play();
            });
            this.load.start();
        }

        // Draw grid overlay if enabled
        this.drawGridOverlay();

        this.startTime = Date.now();
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

    drawGridOverlay() {
        const settings = this.loadSettings();
        if (!settings.gridEnabled) return;

        const gridWidth = this.levelData.gridWidth;
        const gridHeight = this.levelData.gridHeight;

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.25);
        graphics.setDepth(100);

        // Vertical lines
        for (let x = 0; x <= gridWidth; x++) {
            graphics.moveTo(x * this.tileSize, 0);
            graphics.lineTo(x * this.tileSize, gridHeight * this.tileSize);
        }

        // Horizontal lines
        for (let y = 0; y <= gridHeight; y++) {
            graphics.moveTo(0, y * this.tileSize);
            graphics.lineTo(gridWidth * this.tileSize, y * this.tileSize);
        }

        graphics.strokePath();

        // Optional: Add coordinate labels at grid intersections
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                this.add.text(
                    x * this.tileSize + 4,
                    y * this.tileSize + 2,
                    `${x},${y}`,
                    { fontSize: '8px', color: '#ffffff', alpha: 0.3 }
                ).setDepth(101).setAlpha(0.4);
            }
        }
    }

    update() {
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.updateHUD) {
                uiScene.updateHUD(elapsed, this.attempts, this.collected, this.levelData.collectibles.length);
            }
        }
    }

    drawTilemap() {
        const tiles = this.levelData.tiles;
        const decorations = this.levelData.decorations;

        // Draw base layer
        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                const frame = tiles[y][x];
                const posX = x * this.tileSize + this.tileSize / 2;
                const posY = y * this.tileSize + this.tileSize / 2;

                const tile = this.add.image(posX, posY, 'tileset', frame);
                tile.setDisplaySize(this.tileSize, this.tileSize);
            }
        }

        // Draw decoration layer (on top of base)
        if (decorations) {
            for (let y = 0; y < decorations.length; y++) {
                for (let x = 0; x < decorations[y].length; x++) {
                    const frame = decorations[y][x];
                    if (frame !== null && frame !== undefined) {
                        const posX = x * this.tileSize + this.tileSize / 2;
                        const posY = y * this.tileSize + this.tileSize / 2;

                        const decor = this.add.image(posX, posY, 'tileset', frame);
                        decor.setDisplaySize(this.tileSize, this.tileSize);
                        decor.setDepth(10); // Above base tiles
                    }
                }
            }
        }
    }

    spawnCollectibles() {
        // Legacy type to frame mapping for backwards compatibility
        const frameMap = { 'tire': 0, 'bottle': 1, 'bag': 2 };

        this.levelData.collectibles.forEach(item => {
            const x = item.x * this.tileSize + this.tileSize / 2;
            const y = item.y * this.tileSize + this.tileSize / 2;

            // Use frame directly if available, otherwise fallback to type mapping
            const frame = item.frame ?? (frameMap[item.type] ?? 0);
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

        // Check blocked map
        if (this.blockedMap.has(`${gridX},${gridY}`)) {
            return false;
        }

        return true;
    }

    collectAtPosition(gridX, gridY) {
        const item = this.collectibles.find(c => c.gridX === gridX && c.gridY === gridY && !c.collected);
        if (item) {
            item.collected = true;
            this.collected++;

            // Play collect sound
            const settings = this.loadSettings();
            if (settings.soundEnabled && this.cache.audio.exists('get_sound')) {
                const getSound = this.sound.get('get_sound') || this.sound.add('get_sound', { volume: 0.85 });
                getSound.play();
            }

            this.tweens.add({
                targets: item,
                scale: 1.5,
                alpha: 0,
                y: item.y - 30,
                duration: 300,
                onComplete: () => item.setVisible(false)
            });

            // Check victory condition
            this.checkVictory();
        }
    }

    checkVictory() {
        const condition = this.levelData.victoryCondition || 'collectAll';
        const allCollected = this.collected === this.levelData.collectibles.length;
        const atGoal = this.levelData.goalPosition &&
            this.robot.gridX === this.levelData.goalPosition.x &&
            this.robot.gridY === this.levelData.goalPosition.y;

        let won = false;

        switch (condition) {
            case 'collectAll':
                won = allCollected;
                break;
            case 'reachGoal':
                won = atGoal;
                break;
            case 'both':
                won = allCollected && atGoal;
                break;
        }

        if (won) {
            this.time.delayedCall(500, () => this.levelComplete());
        }
    }

    async executeCommands(commands) {
        await Interpreter.execute(commands, this.robot, this);

        // Check victory after execution
        this.checkVictory();
    }

    levelComplete() {
        const timeUsed = Math.floor((Date.now() - this.startTime) / 1000);
        const stars = this.calculateStars(timeUsed, this.attempts);

        // Stop level music
        this.sound.stopByKey('music_level');

        this.scene.stop('UIScene');

        this.scene.start('LevelCompleteScene', {
            levelId: this.levelId,
            stars: stars,
            timeUsed: timeUsed,
            attempts: this.attempts,
            collected: this.collected,
            total: this.levelData.collectibles.length,
            victory: true,
            outroCutscene: this.levelData.outroCutscene || null,
            isLastLevel: this.levelData.isLastLevel || false
        });
    }

    calculateStars(time, attempts) {
        const sc = this.levelData.stars;
        if (time <= sc.time[2] && attempts <= sc.attempts[2]) return 3;
        if (time <= sc.time[1] && attempts <= sc.attempts[1]) return 2;
        if (time <= sc.time[0] && attempts <= sc.attempts[0]) return 1;
        return 0;
    }

    setupCameraDrag() {
        this.isDraggingCamera = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cameraStartX = 0;
        this.cameraStartY = 0;

        // Create invisible drag zone covering the whole world
        const worldWidth = this.levelData.gridWidth * this.tileSize;
        const worldHeight = this.levelData.gridHeight * this.tileSize;

        this.input.on('pointerdown', (pointer) => {
            // Don't start drag if clicking on robot (let robot click through)
            const robotBounds = this.robot.sprite.getBounds();
            if (robotBounds.contains(pointer.worldX, pointer.worldY)) {
                return;
            }

            this.isDraggingCamera = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.cameraStartX = this.cameras.main.scrollX;
            this.cameraStartY = this.cameras.main.scrollY;

            // Stop following robot while dragging
            this.cameras.main.stopFollow();
        });

        this.input.on('pointermove', (pointer) => {
            if (!this.isDraggingCamera) return;

            const zoom = this.cameras.main.zoom;
            const deltaX = (this.dragStartX - pointer.x) / zoom;
            const deltaY = (this.dragStartY - pointer.y) / zoom;

            this.cameras.main.scrollX = this.cameraStartX + deltaX;
            this.cameras.main.scrollY = this.cameraStartY + deltaY;
        });

        this.input.on('pointerup', () => {
            if (!this.isDraggingCamera) return;

            this.isDraggingCamera = false;

            // Smoothly return camera to follow robot
            this.tweens.add({
                targets: this.cameras.main,
                scrollX: this.robot.sprite.x - this.cameras.main.width / 2,
                scrollY: this.robot.sprite.y - this.cameras.main.height / 2,
                duration: 400,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    // Resume following robot
                    this.cameras.main.startFollow(this.robot.sprite, true, 0.1, 0.1);
                }
            });
        });
    }
}
