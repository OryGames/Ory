/**
 * CreditsScene - Shows game credits after completing the final level
 */
class CreditsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditsScene' });
    }

    // Assets loaded by PreloaderScene

    create() {
        const { width, height } = this.scale;

        // Stop all background music when entering credits
        this.sound.stopByKey('music_title');
        this.sound.stopByKey('music_levelselect');
        this.sound.stopByKey('music_cutscene');
        this.sound.stopByKey('music_level');

        // Play endgame music
        if (this.cache.audio.exists('music_endgame')) {
            const settings = this.loadSettings();
            const music = this.sound.add('music_endgame', { loop: true, volume: 0.5 });
            music.setMute(!settings.musicEnabled);
            music.play();
        }

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a1628);

        // Stars/particles background effect
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));

            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1
            });
        }

        // Credits content
        const creditsData = [
            { type: 'title', text: '🎉 PARABÉNS!' },
            { type: 'subtitle', text: 'Você completou todas as missões!' },
            { type: 'spacer' },
            { type: 'title', text: 'ORY: Contra Dengue' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Desenvolvimento' },
            { type: 'credit', text: 'Rafael Kazuo Sato Simião' },
            { type: 'credit', text: ' -> linkedin.com/in/kazuosam/' },
            { type: 'spacer' },
            { type: 'credit', text: 'Carlos Alberto Jahara' },
            { type: 'credit', text: ' -> linkedin.com/in/carlos-jahara-79115114' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Artes e Sprites' },
            { type: 'credit', text: 'Tileset: Buch' },
            { type: 'credit', text: ' -> blog-buch.rhcloud.com' },
            { type: 'spacer' },
            { type: 'credit', text: 'Personagens: looneybits' },
            { type: 'credit', text: ' -> looneybits.github.io' },
            { type: 'spacer' },
            { type: 'credit', text: 'Box camouflage: Johann C' },
            { type: 'credit', text: ' -> opengameart.org/content/svg-isometric-boxes' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Som e Música' },
            { type: 'credit', text: 'Efeitos: qubodup, with sources by' },
            { type: 'credit', text: ' -> Ferdinger, John Sipos and klankbeeld' },
            { type: 'spacer' },
            { type: 'credit', text: 'Dklon - Devin Watson' },
            { type: 'credit', text: ' -> opengameart.org/users/dklon' },
            { type: 'spacer' },
            { type: 'credit', text: 'BLACK LODGE GAMES, LLC' },
            { type: 'credit', text: ' -> blacklodgegames.com' },
            { type: 'spacer' },
            { type: 'credit', text: 'phoenix1291' },
            { type: 'credit', text: ' -> phoenix1291.itch.io' },
            { type: 'spacer' },
            { type: 'credit', text: 'Fupi' },
            { type: 'credit', text: ' -> fupicat.github.io' },
            { type: 'spacer' },
            { type: 'credit', text: 'Música: Rafael Kazuo / Suno.ai' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Design das peças' },
            { type: 'credit', text: 'Carlos Alberto Jahara' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Videos e Cutscenes' },
            { type: 'credit', text: 'Rafael Kazuo / Google Veo3 e GROK Imagine' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Visão Computacional' },
            { type: 'credit', text: 'Gerabytes.AI' },
            { type: 'credit', text: 'https://gerabytes.ai' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Tecnologias' },
            { type: 'credit', text: 'Phaser 3' },
            { type: 'credit', text: 'TensorFlow.js' },
            { type: 'credit', text: 'Suno.ai' },
            { type: 'credit', text: 'Google Veo3' },
            { type: 'credit', text: 'GROK Imagine' },
            { type: 'credit', text: 'Ultralytics YOLOv8' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'header', text: 'Agradecimentos' },
            { type: 'credit', text: 'Rodrigo Souza' },
            { type: 'credit', text: ' -> linkedin.com/in/rodrigophpro' },
            { type: 'spacer' },
            { type: 'credit', text: 'Isabella Farias' },
            { type: 'credit', text: ' -> linkedin.com/in/isabella-farias' },
            { type: 'spacer' },
            { type: 'credit', text: 'Comunidade Open Source' },
            { type: 'spacer' },
            { type: 'credit', text: 'Todos os jogadores!' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'footer', text: 'Obrigado por jogar! 🤖❤️' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'spacer' },
            { type: 'footer', text: 'OryGames © 2026' }
        ];

        // Create credits container (for scrolling)
        this.creditsContainer = this.add.container(width / 2, height + 50);

        let yPos = 0;
        creditsData.forEach(item => {
            let text;
            switch (item.type) {
                case 'title':
                    text = this.add.text(0, yPos, item.text, {
                        fontSize: '36px',
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        color: '#00ffcc',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
                    yPos += 60;
                    break;
                case 'subtitle':
                    text = this.add.text(0, yPos, item.text, {
                        fontSize: '20px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#88ccff'
                    }).setOrigin(0.5);
                    yPos += 40;
                    break;
                case 'header':
                    text = this.add.text(0, yPos, item.text, {
                        fontSize: '24px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#ffcc00',
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    yPos += 45;
                    break;
                case 'credit':
                    text = this.add.text(0, yPos, item.text, {
                        fontSize: '18px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#ffffff'
                    }).setOrigin(0.5);
                    yPos += 30;
                    break;
                case 'footer':
                    text = this.add.text(0, yPos, item.text, {
                        fontSize: '28px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#ff88cc'
                    }).setOrigin(0.5);
                    yPos += 50;
                    break;
                case 'spacer':
                    yPos += 30;
                    break;
            }
            if (text) {
                this.creditsContainer.add(text);
            }
        });

        // Scroll credits up
        const totalHeight = yPos;
        const scrollDuration = 60000; // 60 seconds to scroll

        this.tweens.add({
            targets: this.creditsContainer,
            y: -totalHeight,
            duration: scrollDuration,
            ease: 'Linear',
            onComplete: () => {
                this.showEndScreen();
            }
        });

        // Skip/speed up with tap
        this.input.on('pointerdown', () => {
            this.showEndScreen();
        });

        // Skip text
        this.add.text(width / 2, height - 30, '👆 Toque para pular', {
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5).setDepth(100);

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    showEndScreen() {
        // Stop any running tweens
        this.tweens.killAll();

        const { width, height } = this.scale;

        // Fade to end screen
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.time.delayedCall(600, () => {
            // Clear and show final screen
            this.children.removeAll();
            this.cameras.main.fadeIn(500, 0, 0, 0);

            // Load and play background video in loop
            if (!this.cache.video.has('endvideo')) {
                this.load.video('endvideo', './assets/videos/endv.mp4', 'loadeddata', false, true);
                this.load.once('complete', () => {
                    this.createEndScreenContent();
                });
                this.load.start();
            } else {
                this.createEndScreenContent();
            }
        });
    }

    createEndScreenContent() {
        const { width, height } = this.scale;

        // Background video
        this.bgVideo = this.add.video(width / 2, height / 2, 'endvideo');

        // Wait for video to be ready then scale properly
        this.bgVideo.on('play', () => {
            const videoWidth = this.bgVideo.width || this.bgVideo.displayWidth;
            const videoHeight = this.bgVideo.height || this.bgVideo.displayHeight;
            if (videoWidth > 0 && videoHeight > 0) {
                const aspectRatio = videoHeight / videoWidth;
                this.bgVideo.setDisplaySize(width, width * aspectRatio);
            }
        });

        this.bgVideo.setLoop(true);
        this.bgVideo.play();
        this.bgVideo.setAlpha(0.6); // Slightly dimmed video

        // Dark overlay (lighter)
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3).setDepth(1);

        this.add.text(width / 2, height * 0.3, '🏆', {
            fontSize: '80px'
        }).setOrigin(0.5).setDepth(2);

        this.add.text(width / 2, height * 0.5, 'FIM DE JOGO', {
            fontSize: '40px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#00ffcc',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2);

        this.add.text(width / 2, height * 0.6, 'Obrigado por jogar!', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(2);

        // Tap to continue hint
        this.add.text(width / 2, height * 0.8, '👆 Toque para voltar ao início', {
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(2);

        // Click anywhere to go back to title
        this.input.once('pointerdown', () => {
            if (this.bgVideo) this.bgVideo.stop();
            this.sound.stopByKey('music_endgame');
            this.scene.start('TitleScene');
        });
    }

    handleResize(gameSize) {
        // Restart scene on resize for proper layout
        this.scene.restart();
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
