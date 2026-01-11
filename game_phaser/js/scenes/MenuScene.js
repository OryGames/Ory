class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Stop UIScene if it's running
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }

        // Background
        this.cameras.main.setBackgroundColor('#1a3a2f');

        // Title
        this.add.text(this.cameras.main.centerX, 80, '🦟 ORY: Caça Dengue 🦟', {
            fontSize: '42px',
            fontFamily: 'Arial',
            color: '#00d4bb',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, 130, 'Programe o robô para limpar a cidade!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#aaa'
        }).setOrigin(0.5);

        // Level Buttons
        const levels = [
            { id: 1, name: 'Quintal da Casa', stars: this.getStars(1) },
            { id: 2, name: 'Rua do Bairro', stars: this.getStars(2) },
            { id: 3, name: 'Parque Municipal', stars: this.getStars(3) }
        ];

        levels.forEach((level, i) => {
            const y = 220 + i * 100;

            // Button Background
            const btn = this.add.rectangle(this.cameras.main.centerX, y, 400, 70, 0x2a5a4f)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => btn.setFillStyle(0x3a7a6f))
                .on('pointerout', () => btn.setFillStyle(0x2a5a4f))
                .on('pointerdown', () => this.startLevel(level.id));

            // Level Name
            this.add.text(this.cameras.main.centerX - 150, y, `Nível ${level.id}: ${level.name}`, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#fff'
            }).setOrigin(0, 0.5);

            // Stars
            const starText = '⭐'.repeat(level.stars) + '☆'.repeat(3 - level.stars);
            this.add.text(this.cameras.main.centerX + 150, y, starText, {
                fontSize: '24px'
            }).setOrigin(1, 0.5);
        });

        // Instructions
        this.add.text(this.cameras.main.centerX, 550,
            '💡 Clique no robô durante o jogo para escanear blocos de código', {
            fontSize: '14px',
            color: '#888'
        }).setOrigin(0.5);
    }

    getStars(levelId) {
        const data = localStorage.getItem(`ory_level_${levelId}`);
        return data ? JSON.parse(data).stars : 0;
    }

    startLevel(levelId) {
        this.scene.start('LevelScene', { levelId });
    }
}
