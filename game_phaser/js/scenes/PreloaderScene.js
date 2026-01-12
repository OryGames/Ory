/**
 * PreloaderScene - Loads all game assets upfront with a progress bar
 */
class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        // Logo text - responsive font size
        const titleSize = Math.min(width * 0.08, 48);
        this.add.text(width / 2, height * 0.35, 'Carregando Ory...', {
            fontSize: titleSize + 'px',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#00d4bb',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const subtitleSize = Math.min(width * 0.05, 24);
        this.add.text(width / 2, height * 0.45, 'Por favor, aguarde...', {
            fontSize: subtitleSize + 'px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar background
        const barWidth = Math.min(width * 0.7, 400);
        const barHeight = 30;
        const barX = width / 2 - barWidth / 2;
        const barY = height * 0.6;

        this.add.rectangle(width / 2, barY + barHeight / 2, barWidth + 4, barHeight + 4, 0x333333);

        // Progress bar fill
        this.progressBar = this.add.graphics();
        this.progressBarX = barX;
        this.progressBarY = barY;
        this.progressBarWidth = barWidth;
        this.progressBarHeight = barHeight;

        // Loading text
        this.loadingText = this.add.text(width / 2, height * 0.72, 'Carregando... 0%', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888'
        }).setOrigin(0.5);

        // Progress events
        this.load.on('progress', (value) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xf5a623, 1);
            this.progressBar.fillRoundedRect(
                this.progressBarX,
                this.progressBarY,
                this.progressBarWidth * value,
                this.progressBarHeight,
                8
            );
            this.loadingText.setText(`Carregando... ${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            this.loadingText.setText('Pronto!');
        });

        // ==========================================
        // LOAD ALL GAME ASSETS
        // ==========================================

        // --- IMAGES: Splash/Backgrounds ---
        this.load.image('orygames_splash', './assets/sprites/orygames_splash.png');
        this.load.image('info_bg', './assets/sprites/infobg.png');
        this.load.image('splash_landscape', './assets/sprites/splash_bg.png');
        this.load.image('splash_portrait', './assets/sprites/splash_portrait.png');
        this.load.image('level_map', './assets/sprites/level_map.png');
        this.load.image('level_complete_bg', './assets/sprites/endmission.png');
        this.load.image('options_bg', './assets/sprites/bgoptions.png');

        // --- SPRITESHEETS ---
        // Note: tileset and collectibles are NOT preloaded here because
        // each level can have different configurations (tileSize, frameSize, etc.)
        // They are loaded dynamically in LevelScene.create()

        // --- CHARACTERS: boxbot ---
        const boxbotPath = './assets/sprites/characters/boxbot/';
        this.load.image('boxbot_down_idle', boxbotPath + 'player_down_idle.png');
        this.load.image('boxbot_down', boxbotPath + 'player_down.png');
        this.load.image('boxbot_down_1', boxbotPath + 'player_down_1.png');
        this.load.image('boxbot_up_idle', boxbotPath + 'player_up_idle.png');
        this.load.image('boxbot_up', boxbotPath + 'player_up.png');
        this.load.image('boxbot_up_1', boxbotPath + 'player_up_1.png');
        this.load.image('boxbot_right_idle', boxbotPath + 'player_right_idle.png');
        this.load.image('boxbot_right', boxbotPath + 'player_right.png');
        this.load.image('boxbot_right_1', boxbotPath + 'player_right_1.png');

        // --- CHARACTERS: bluebot ---
        const bluebotPath = './assets/sprites/characters/bluebot/';
        this.load.image('bluebot_down_idle', bluebotPath + 'player_down_idle.png');
        this.load.image('bluebot_down', bluebotPath + 'player_down.png');
        this.load.image('bluebot_down_1', bluebotPath + 'player_down_1.png');
        this.load.image('bluebot_up_idle', bluebotPath + 'player_up_idle.png');
        this.load.image('bluebot_up', bluebotPath + 'player_up.png');
        this.load.image('bluebot_up_1', bluebotPath + 'player_up_1.png');
        this.load.image('bluebot_right_idle', bluebotPath + 'player_right_idle.png');
        this.load.image('bluebot_right', bluebotPath + 'player_right.png');
        this.load.image('bluebot_right_1', bluebotPath + 'player_right_1.png');

        // --- AUDIO: Sound Effects ---
        this.load.audio('select_sound', './assets/audio/select.mp3');
        this.load.audio('win_sound', './assets/audio/win.mp3');
        this.load.audio('cmd_sound', './assets/audio/movement/cmd.mp3');
        this.load.audio('mov_sound', './assets/audio/movement/mov1.mp3');
        this.load.audio('get_sound', './assets/audio/movement/get.mp3');

        // --- AUDIO: Music ---
        this.load.audio('music_title', './assets/audio/music/Ory_ContraaDengue.mp3');
        this.load.audio('music_levelselect', './assets/audio/music/Ory_levelselect.mp3');
        this.load.audio('music_endgame', './assets/audio/music/endgame.mp3');

        // --- VIDEO ---
        this.load.video('endvideo', './assets/videos/endv.mp4', 'loadeddata', false, true);

        // --- LEVEL JSONs ---
        this.load.json('level1', './assets/levels/level1.json');
        this.load.json('level2', './assets/levels/level2.json');
        this.load.json('level3', './assets/levels/level3.json');
        this.load.json('level4', './assets/levels/level4.json');
    }

    async create() {
        // Load TensorFlow.js AI model (after Phaser assets are done)
        this.loadingText.setText('Carregando IA...');

        try {
            console.log('PreloaderScene: Loading AI model...');
            window.preloadedAIModel = await tf.loadGraphModel('./assets/model/model.json');

            // Warmup the model with a dummy tensor
            const zeroTensor = tf.zeros([1, 640, 640, 3], 'float32');
            const result = await window.preloadedAIModel.execute(zeroTensor);
            tf.dispose(result);
            tf.dispose(zeroTensor);

            console.log('PreloaderScene: AI model ready!');
            this.loadingText.setText('Pronto!');
        } catch (e) {
            console.error('PreloaderScene: Failed to load AI model:', e);
            this.loadingText.setText('Pronto!');
        }

        // Brief delay before transitioning
        this.time.delayedCall(500, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('SplashScene');
            });
        });
    }
}
