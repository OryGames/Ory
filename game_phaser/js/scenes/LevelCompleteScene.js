class LevelCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelCompleteScene' });
    }

    init(data) {
        this.levelId = data.levelId;
        this.stars = data.stars;
        this.timeUsed = data.timeUsed;
        this.attempts = data.attempts;
        this.collected = data.collected;
        this.total = data.total;
        this.victory = data.victory || false;
        this.outroCutscene = data.outroCutscene || null;
        this.isLastLevel = data.isLastLevel || false;
    }

    // Assets loaded by PreloaderScene

    create() {
        const { width, height } = this.scale;

        // Play win sound
        const settings = this.loadSettings();
        if (settings.soundEnabled && this.cache.audio.exists('win_sound')) {
            this.sound.play('win_sound', { volume: 0.6 });
        }

        // Start level select music if not already playing (stop level music first)
        this.sound.stopByKey('music_level');

        // Check if music_levelselect is already playing
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

        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Background image
        this.bg = this.add.image(width / 2, height / 2, 'level_complete_bg');
        const scaleX = width / this.bg.width;
        const scaleY = height / this.bg.height;
        this.bg.setScale(Math.max(scaleX, scaleY));

        // Dark overlay for readability
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        // Title - based on victory flag
        const isVictory = this.victory;
        const title = isVictory ? '🎉 Nível Completo!' : '😢 Tente Novamente';

        this.add.text(width / 2, height * 0.15, title, {
            fontSize: Math.min(width * 0.08, 36) + 'px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: isVictory ? '#00d4bb' : '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stars
        const starDisplay = '⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
        this.add.text(width / 2, height * 0.28, starDisplay, {
            fontSize: '48px'
        }).setOrigin(0.5);

        // Stats
        const stats = [
            `⏱️ Tempo: ${this.timeUsed}s`,
            `🔄 Tentativas: ${this.attempts}`,
            `🗑️ Coletados: ${this.collected}/${this.total}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(width / 2, height * 0.40 + i * 40, stat, {
                fontSize: '20px',
                fontFamily: 'Arial, sans-serif',
                color: '#cccccc'
            }).setOrigin(0.5);
        });

        // Buttons
        const btnY = height * 0.75;

        // If there's an outro cutscene and victory, add a "Continue" button
        if (isVictory && this.outroCutscene) {
            // If last level, only show Continue button (centered)
            if (this.isLastLevel) {
                this.createButton(width / 2, btnY, '▶️ Continuar', () => {
                    this.playCutscene();
                });
            } else {
                // Normal level: show Continue, Replay, Menu
                this.createButton(width / 2, btnY - 60, '▶️ Continuar', () => {
                    this.playCutscene();
                });

                this.createButton(width / 2 - 100, btnY, '🔄 Replay', () => {
                    this.scene.start('LevelScene', { levelId: this.levelId });
                });

                this.createButton(width / 2 + 100, btnY, '🏠 Menu', () => {
                    this.scene.start('MenuScene');
                });
            }
        } else {
            // No cutscene: show Replay and Menu
            this.createButton(width / 2 - 100, btnY, '🔄 Replay', () => {
                this.scene.start('LevelScene', { levelId: this.levelId });
            });

            this.createButton(width / 2 + 100, btnY, '🏠 Menu', () => {
                this.scene.start('MenuScene');
            });
        }

        // Save Progress - if victory
        if (isVictory && this.stars > 0) {
            const prev = localStorage.getItem(`ory_level_${this.levelId}`);
            const prevStars = prev ? JSON.parse(prev).stars : 0;
            if (this.stars > prevStars) {
                localStorage.setItem(`ory_level_${this.levelId}`, JSON.stringify({ stars: this.stars }));
            }
        }

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    playCutscene() {
        // If last level, go to credits after cutscene; otherwise go to menu
        const nextScene = this.isLastLevel ? 'CreditsScene' : 'MenuScene';

        this.scene.start('CutsceneScene', {
            cutscene: this.outroCutscene,
            nextScene: nextScene,
            nextData: {}
        });
    }

    handleResize(gameSize) {
        // Recreate scene on resize for proper layout
        this.scene.restart();
    }

    createButton(x, y, text, callback) {
        const scene = this;
        const btn = this.add.rectangle(x, y, 180, 50, 0xc47b17, 1)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0xf5a623))
            .on('pointerout', () => btn.setFillStyle(0xc47b17))
            .on('pointerdown', () => {
                const settings = scene.loadSettings();
                if (settings.soundEnabled && scene.cache.audio.exists('select_sound')) {
                    scene.sound.play('select_sound', { volume: 0.5 });
                }
                callback();
            });

        // Border
        const border = this.add.rectangle(x, y, 180, 50);
        border.setStrokeStyle(2, 0xffd54f);

        this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);
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
}
