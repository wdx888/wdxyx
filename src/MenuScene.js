/**
 * 主菜单场景
 * 赛博朋克风格背景，标题、开始按钮、操作说明
 */

import { CONFIG } from '../config.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // 背景：深色带网格线
        this.drawGridBackground();

        // 标题
        this.add.text(width / 2, height / 2 - 120, '赛博风暴', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '48px',
            color: '#00f0ff',
            stroke: '#005566',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 70, 'CYBER TANK ARENA', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '18px',
            color: '#00f0ff',
        }).setOrigin(0.5);

        // 开始按钮
        const startBtn = this.add.text(width / 2, height / 2 + 20, '\u25b6 开始游戏', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '28px',
            color: '#00f0ff',
            backgroundColor: '#0a1a2a',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // 悬停效果
        startBtn.on('pointerover', () => startBtn.setColor('#ffffff'));
        startBtn.on('pointerout', () => startBtn.setColor('#00f0ff'));
        startBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
            });
        });

        // 操作说明
        const controls = [
            'WASD / 方向键 - 移动',
            '鼠标左键 / 空格 - 射击',
            '1/2 或 Q/E - 切换武器',
            '保护基地能源塔！',
        ];
        controls.forEach((text, i) => {
            this.add.text(width / 2, height / 2 + 100 + i * 28, text, {
                fontFamily: 'Microsoft YaHei, sans-serif',
                fontSize: '14px',
                color: '#6688aa',
            }).setOrigin(0.5);
        });

        // 淡入效果
        this.cameras.main.fadeIn(500);

        // 装饰性粒子
        this.createDecorParticles();
    }

    /**
     * 绘制网格背景
     */
    drawGridBackground() {
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a1a3a, 0.5);
        for (let x = 0; x <= CONFIG.MAP_WIDTH; x += CONFIG.TILE_SIZE) {
            g.lineBetween(x, 0, x, CONFIG.MAP_HEIGHT);
        }
        for (let y = 0; y <= CONFIG.MAP_HEIGHT; y += CONFIG.TILE_SIZE) {
            g.lineBetween(0, y, CONFIG.MAP_WIDTH, y);
        }
    }

    /**
     * 创建装饰性漂浮粒子
     */
    createDecorParticles() {
        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                const x = Phaser.Math.Between(0, CONFIG.MAP_WIDTH);
                const y = Phaser.Math.Between(0, CONFIG.MAP_HEIGHT);
                const p = this.add.circle(x, y, 2, 0x00f0ff, 0.3);
                this.tweens.add({
                    targets: p,
                    alpha: 0,
                    y: y - 50,
                    duration: 2000,
                    onComplete: () => p.destroy(),
                });
            },
        });
    }
}