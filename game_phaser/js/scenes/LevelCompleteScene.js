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
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Title
        const title = this.collected === this.total ? '🎉 Nível Completo! 🎉' : '😢 Tente Novamente';
        this.add.text(this.cameras.main.centerX, 100, title, {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: this.collected === this.total ? '#00d4bb' : '#ff6b6b'
        }).setOrigin(0.5);

        // Stars
        const starDisplay = '⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
        this.add.text(this.cameras.main.centerX, 180, starDisplay, {
            fontSize: '48px'
        }).setOrigin(0.5);

        // Stats
        const stats = [
            `⏱️ Tempo: ${this.timeUsed}s`,
            `🔄 Tentativas: ${this.attempts}`,
            `🗑️ Coletados: ${this.collected}/${this.total}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(this.cameras.main.centerX, 260 + i * 40, stat, {
                fontSize: '22px',
                color: '#ccc'
            }).setOrigin(0.5);
        });

        // Buttons
        this.createButton(this.cameras.main.centerX - 120, 450, '🔄 Replay', () => {
            this.scene.start('LevelScene', { levelId: this.levelId });
        });

        this.createButton(this.cameras.main.centerX + 120, 450, '🏠 Menu', () => {
            this.scene.start('MenuScene');
        });

        // Save Progress
        if (this.collected === this.total) {
            const prev = localStorage.getItem(`ory_level_${this.levelId}`);
            const prevStars = prev ? JSON.parse(prev).stars : 0;
            if (this.stars > prevStars) {
                localStorage.setItem(`ory_level_${this.levelId}`, JSON.stringify({ stars: this.stars }));
            }
        }
    }

    createButton(x, y, text, callback) {
        const btn = this.add.rectangle(x, y, 180, 50, 0x2a5a4f)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x3a7a6f))
            .on('pointerout', () => btn.setFillStyle(0x2a5a4f))
            .on('pointerdown', callback);

        this.add.text(x, y, text, {
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);
    }
}
