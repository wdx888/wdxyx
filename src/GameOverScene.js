/**
 * 游戏结束/结算场景
 * 显示最终分数、到达波次，提供重新开始和返回菜单选项
 */

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalWave = data.wave || 0;
    }

    create() {
        const { width, height } = this.cameras.main;

        // 深色背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

        // 标题
        this.add
            .text(width / 2, height / 2 - 120, '基地已摧毁', {
                fontFamily: 'Orbitron, monospace',
                fontSize: '36px',
                color: '#ff0044',
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height / 2 - 70, 'GAME OVER', {
                fontFamily: 'Orbitron, monospace',
                fontSize: '24px',
                color: '#ff0044',
            })
            .setOrigin(0.5);

        // 统计数据
        this.add
            .text(width / 2, height / 2, `最终分数: ${this.finalScore}`, {
                fontFamily: 'Orbitron, monospace',
                fontSize: '22px',
                color: '#00f0ff',
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height / 2 + 40, `到达波次: ${this.finalWave}`, {
                fontFamily: 'Orbitron, monospace',
                fontSize: '22px',
                color: '#00f0ff',
            })
            .setOrigin(0.5);

        // 重新开始按钮
        const restartBtn = this.add
            .text(width / 2, height / 2 + 120, '重新开始', {
                fontFamily: 'Orbitron, monospace',
                fontSize: '28px',
                color: '#00ff66',
                backgroundColor: '#0a2a1a',
                padding: { x: 30, y: 15 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', () => restartBtn.setColor('#ffffff'));
        restartBtn.on('pointerout', () => restartBtn.setColor('#00ff66'));
        restartBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
            });
        });

        // 返回菜单按钮
        const menuBtn = this.add
            .text(width / 2, height / 2 + 180, '返回菜单', {
                fontFamily: 'Orbitron, monospace',
                fontSize: '20px',
                color: '#666688',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#666688'));
        menuBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });

        // 淡入效果
        this.cameras.main.fadeIn(500);
    }
}