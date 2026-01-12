/**
 * CutsceneScene - Plays video or image sequence before/after levels
 * Supports: MP4 video or image sequence with timing
 */
class CutsceneScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CutsceneScene' });
    }

    init(data) {
        this.cutsceneData = data.cutscene; // { type: 'video'|'images', path/paths, duration }
        this.nextScene = data.nextScene;   // Scene to go to after
        this.nextData = data.nextData;     // Data to pass to next scene
    }

    preload() {
        const { width, height } = this.scale;

        // Loading text
        this.loadText = this.add.text(width / 2, height / 2, 'Carregando...', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        if (this.cutsceneData.type === 'video') {
            this.load.video('cutscene_video', this.cutsceneData.path, 'loadeddata', false, true);
        } else if (this.cutsceneData.type === 'images') {
            this.cutsceneData.paths.forEach((path, i) => {
                this.load.image(`cutscene_img_${i}`, path);
            });
        }

        this.load.audio('select_sound', './assets/audio/select.mp3');
        this.load.audio('music_levelselect', './assets/audio/music/Ory_levelselect.mp3');
    }

    create() {
        const { width, height } = this.scale;

        // Remove loading text
        if (this.loadText) this.loadText.destroy();

        // Stop ALL background music first to prevent overlapping
        this.sound.stopByKey('music_title');
        this.sound.stopByKey('music_levelselect');
        this.sound.stopByKey('music_cutscene');

        // Play cutscene-specific music if defined in cutscene data
        // Example in level JSON: "introCutscene": { "type": "video", "path": "...", "music": "./assets/audio/music/custom.mp3" }
        if (this.cutsceneData.music) {
            const settings = this.loadSettings();
            if (!this.cache.audio.exists('music_cutscene')) {
                // Load and play after loaded
                this.load.audio('music_cutscene', this.cutsceneData.music);
                this.load.once('complete', () => {
                    const music = this.sound.add('music_cutscene', { loop: true, volume: 0.4 });
                    music.setMute(!settings.musicEnabled);
                    music.play();
                });
                this.load.start();
            } else {
                const music = this.sound.add('music_cutscene', { loop: true, volume: 0.4 });
                music.setMute(!settings.musicEnabled);
                music.play();
            }
        }

        // Dark background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        if (this.cutsceneData.type === 'video') {
            this.playVideo();
        } else if (this.cutsceneData.type === 'images') {
            this.playImageSequence();
        }

        // Skip button
        this.skipBtn = this.add.text(width - 20, 30, 'Pular ⏭️', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0.5).setDepth(200).setInteractive({ useHandCursor: true });

        this.skipBtn.on('pointerover', () => this.skipBtn.setColor('#ffffff'));
        this.skipBtn.on('pointerout', () => this.skipBtn.setColor('#888888'));
        this.skipBtn.on('pointerdown', () => {
            const settings = this.loadSettings();
            if (settings.soundEnabled && this.cache.audio.exists('select_sound')) {
                this.sound.play('select_sound', { volume: 0.5 });
            }
            this.endCutscene();
        });

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    playVideo() {
        const { width, height } = this.scale;

        this.video = this.add.video(width / 2, height / 2, 'cutscene_video');

        // Wait for video to be ready, then scale properly
        this.video.on('play', () => {
            this.scaleVideoToWidth();
        });

        this.video.play();

        this.video.on('complete', () => {
            this.time.delayedCall(500, () => this.endCutscene());
        });
    }

    scaleVideoToWidth() {
        const { width } = this.scale;
        const videoWidth = this.video.width || this.video.displayWidth;
        const videoHeight = this.video.height || this.video.displayHeight;

        if (videoWidth > 0 && videoHeight > 0) {
            // Calculate new height based on 100% width while maintaining aspect ratio
            const aspectRatio = videoHeight / videoWidth;
            const newWidth = width;
            const newHeight = width * aspectRatio;

            this.video.setDisplaySize(newWidth, newHeight);
        }
    }

    playImageSequence() {
        const { width, height } = this.scale;
        const paths = this.cutsceneData.paths;
        const texts = this.cutsceneData.texts || []; // Narration texts array
        const duration = this.cutsceneData.duration || 3000;

        this.currentImageIndex = 0;

        // Create text box background at bottom
        this.textBoxBg = this.add.rectangle(width / 2, height - 60, width - 40, 100, 0x000000, 0.8);
        this.textBoxBg.setStrokeStyle(2, 0x00d4bb);
        this.textBoxBg.setDepth(150);

        // Create narration text
        this.narrationText = this.add.text(width / 2, height - 60, '', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 80 }
        }).setOrigin(0.5).setDepth(151);

        // Show first text
        if (texts.length > 0 && texts[0]) {
            this.narrationText.setText(texts[0]);
        } else {
            this.textBoxBg.setVisible(false);
            this.narrationText.setVisible(false);
        }

        // Create image
        this.currentImage = this.add.image(width / 2, height / 2 - 30, 'cutscene_img_0');
        this.scaleImageToFit(this.currentImage);

        // Fade in first image
        this.currentImage.setAlpha(0);
        this.tweens.add({
            targets: this.currentImage,
            alpha: 1,
            duration: 500
        });

        // If multiple images, cycle through them
        if (paths.length > 1) {
            this.imageTimer = this.time.addEvent({
                delay: duration,
                callback: () => this.showNextImage(),
                loop: true
            });
        } else {
            // Single image - show for duration then end
            this.time.delayedCall(duration, () => this.endCutscene());
        }
    }

    showNextImage() {
        const paths = this.cutsceneData.paths;
        const texts = this.cutsceneData.texts || [];
        this.currentImageIndex++;

        if (this.currentImageIndex >= paths.length) {
            // End of sequence
            if (this.imageTimer) this.imageTimer.destroy();
            this.time.delayedCall(500, () => this.endCutscene());
            return;
        }

        // Update narration text
        if (this.narrationText && texts[this.currentImageIndex]) {
            this.narrationText.setText(texts[this.currentImageIndex]);
            this.textBoxBg.setVisible(true);
            this.narrationText.setVisible(true);
        } else if (this.narrationText) {
            this.textBoxBg.setVisible(false);
            this.narrationText.setVisible(false);
        }

        // Fade out current, fade in next
        const { width, height } = this.scale;
        const nextImage = this.add.image(width / 2, height / 2 - 30, `cutscene_img_${this.currentImageIndex}`);
        this.scaleImageToFit(nextImage);
        nextImage.setAlpha(0);

        this.tweens.add({
            targets: this.currentImage,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.currentImage.destroy();
                this.currentImage = nextImage;
            }
        });

        this.tweens.add({
            targets: nextImage,
            alpha: 1,
            duration: 300,
            delay: 200
        });
    }

    scaleImageToFit(image) {
        const { width, height } = this.scale;
        const scaleX = width / image.width;
        const scaleY = height / image.height;
        image.setScale(Math.min(scaleX, scaleY));
    }

    endCutscene() {
        // Clean up video if playing
        if (this.video) {
            this.video.stop();
        }
        if (this.imageTimer) {
            this.imageTimer.destroy();
        }

        // Stop cutscene music
        this.sound.stopByKey('music_cutscene');

        // Fade out and go to next scene
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start(this.nextScene, this.nextData);
        });
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;

        if (this.video) {
            this.video.setPosition(width / 2, height / 2);
            this.scaleVideoToWidth();
        }

        if (this.currentImage) {
            this.currentImage.setPosition(width / 2, height / 2);
            this.scaleImageToFit(this.currentImage);
        }

        if (this.skipBtn) {
            this.skipBtn.setPosition(width - 20, 30);
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
}
