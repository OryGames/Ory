/**
 * MenuScene - Candy Crush Style Level Map
 * Path-based level selection with progressive unlocking
 */
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    // Assets loaded by PreloaderScene

    create() {
        // Stop UIScene if running
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }

        const { width, height } = this.scale;

        // Level data with positions on the map path (relative 0-1)
        this.levels = [
            { id: 1, name: 'Quintal', emoji: '🏠', xRatio: 0.5, yRatio: 0.85 },
            { id: 2, name: 'Rua', emoji: '🛣️', xRatio: 0.35, yRatio: 0.65 },
            { id: 3, name: 'Campo', emoji: '⚽', xRatio: 0.65, yRatio: 0.45 },
            { id: 4, name: 'Parque', emoji: '🌳', xRatio: 0.5, yRatio: 0.25 }
        ];

        // Background map
        this.bg = this.add.image(width / 2, height / 2, 'level_map');
        this.updateBgScale();

        // Title banner at top
        this.banner = this.add.graphics();
        this.titleText = this.add.text(width / 2, 25, '🗺️ MAPA DE MISSÕES', {
            fontSize: '24px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        // Create path line connecting levels
        this.pathGraphics = this.add.graphics();

        // Create level nodes
        this.levelNodes = [];
        this.levels.forEach((level, i) => {
            const node = this.createLevelNode(level, i);
            this.levelNodes.push(node);
        });

        // Back button - positioned below title
        this.backBtn = this.add.text(width / 2, 55, '← Voltar ao Início', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#f5a623',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#00000088',
            padding: { x: 12, y: 4 }
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        this.backBtn.on('pointerdown', () => {
            const settings = this.loadSettings();
            if (settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.scene.start('TitleScene');
        });

        // Initial layout
        this.updateLayout();

        // Draw path
        this.drawPath();

        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Stop all other music
        this.sound.stopByKey('music_title');
        this.sound.stopByKey('music_level');
        this.sound.stopByKey('music_cutscene');

        // Only start level select music if not already playing
        // Check all sounds to see if any music_levelselect is playing
        let alreadyPlaying = false;
        this.sound.sounds.forEach(sound => {
            if (sound.key === 'music_levelselect' && sound.isPlaying) {
                alreadyPlaying = true;
            }
        });

        if (!alreadyPlaying) {
            const settings = this.loadSettings();
            const music = this.sound.add('music_levelselect', { loop: true, volume: 0.2 });
            music.setMute(!settings.musicEnabled);
            music.play();
        }

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    createLevelNode(level, index) {
        const { width, height } = this.scale;
        const x = width * level.xRatio;
        const y = height * level.yRatio;

        const container = this.add.container(x, y);
        const isUnlocked = this.isLevelUnlocked(level.id);
        const stars = this.getStars(level.id);

        // Node circle background
        const nodeBg = this.add.graphics();
        if (isUnlocked) {
            // Unlocked - orange golden (matches ORY logo)
            nodeBg.fillStyle(0xf5a623, 1);
            nodeBg.fillCircle(0, 0, 35);
            nodeBg.lineStyle(4, 0xffd54f, 1);
            nodeBg.strokeCircle(0, 0, 35);
        } else {
            // Locked - gray
            nodeBg.fillStyle(0x555555, 1);
            nodeBg.fillCircle(0, 0, 35);
            nodeBg.lineStyle(4, 0x333333, 1);
            nodeBg.strokeCircle(0, 0, 35);
        }
        container.add(nodeBg);

        // Level number or lock
        const centerText = this.add.text(0, isUnlocked ? -5 : 0,
            isUnlocked ? level.id.toString() : '🔒', {
            fontSize: isUnlocked ? '28px' : '24px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: isUnlocked ? '#000000' : '#888888'
        }).setOrigin(0.5);
        container.add(centerText);

        // Stars below (only if unlocked and has stars)
        if (isUnlocked && stars > 0) {
            const starsText = this.add.text(0, 20, '⭐'.repeat(stars), {
                fontSize: '12px'
            }).setOrigin(0.5);
            container.add(starsText);
        }

        // Level name label below node
        const nameLabel = this.add.text(0, 50, level.name, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#00000088',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5);
        container.add(nameLabel);

        // Interactive if unlocked
        if (isUnlocked) {
            const hitArea = this.add.circle(0, 0, 40, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            container.add(hitArea);

            // Pulsing glow effect for current level
            if (stars === 0) {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            hitArea.on('pointerover', () => {
                container.setScale(1.15);
            });

            hitArea.on('pointerout', () => {
                container.setScale(1);
            });

            hitArea.on('pointerdown', () => {
                const settings = this.loadSettings();
                if (settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                    this.sound.play('select_sound', { volume: 0.5 });
                }
                container.setScale(0.95);
            });

            hitArea.on('pointerup', () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(300, () => {
                    this.startLevel(level.id);
                });
            });
        }

        container.setData('level', level);
        container.setDepth(50);

        return container;
    }

    drawPath() {
        const { width, height } = this.scale;

        this.pathGraphics.clear();
        this.pathGraphics.lineStyle(8, 0x8B4513, 0.8); // Brown path

        // Draw path between nodes
        for (let i = 0; i < this.levels.length - 1; i++) {
            const current = this.levels[i];
            const next = this.levels[i + 1];

            const x1 = width * current.xRatio;
            const y1 = height * current.yRatio;
            const x2 = width * next.xRatio;
            const y2 = height * next.yRatio;

            // Draw dashed line
            this.pathGraphics.lineBetween(x1, y1, x2, y2);
        }

        this.pathGraphics.setDepth(10);
    }

    updateBgScale() {
        const { width, height } = this.scale;

        // Scale to cover
        const scaleX = width / this.bg.width;
        const scaleY = height / this.bg.height;
        this.bg.setScale(Math.max(scaleX, scaleY));
        this.bg.setPosition(width / 2, height / 2);
    }

    updateLayout() {
        const { width, height } = this.scale;

        // Update background
        this.updateBgScale();

        // Update banner - taller to fit title + back button
        this.banner.clear();
        this.banner.fillStyle(0x000000, 0.7);
        this.banner.fillRect(0, 0, width, 80);
        this.banner.setDepth(90);

        this.titleText.setPosition(width / 2, 25);
        this.backBtn.setPosition(width / 2, 55);

        // Update node positions
        this.levelNodes.forEach((node, i) => {
            const level = this.levels[i];
            node.setPosition(width * level.xRatio, height * level.yRatio);
        });

        // Redraw path
        this.drawPath();
    }

    handleResize(gameSize) {
        this.updateLayout();
    }

    isLevelUnlocked(levelId) {
        if (levelId === 1) return true; // First level always unlocked

        // Check if previous level has at least 1 star
        const prevStars = this.getStars(levelId - 1);
        return prevStars > 0;
    }

    getStars(levelId) {
        const data = localStorage.getItem(`ory_level_${levelId}`);
        return data ? JSON.parse(data).stars : 0;
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

    async startLevel(levelId) {
        // Fetch level data to check for intro cutscene
        try {
            const response = await fetch(`./assets/levels/level${levelId}.json`);
            const levelData = await response.json();

            if (levelData.introCutscene) {
                // Play intro cutscene first, then go to level
                this.scene.start('CutsceneScene', {
                    cutscene: levelData.introCutscene,
                    nextScene: 'LevelScene',
                    nextData: { levelId }
                });
            } else {
                // No intro, go directly to level
                this.scene.start('LevelScene', { levelId });
            }
        } catch (e) {
            // If fetch fails, just start level
            this.scene.start('LevelScene', { levelId });
        }
    }
}
