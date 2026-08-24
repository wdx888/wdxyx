/**
 * 资源加载场景
 * 显示科技感加载画面，生成所有游戏纹理，零外部素材依赖
 */

import { TextureGenerator } from '../utils/TextureGenerator.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 科技感加载文字
        this.add.text(width / 2, height / 2 - 50, '系统初始化...', {
            fontFamily: 'Orbitron, monospace',
            fontSize: '24px',
            color: '#00f0ff',
        }).setOrigin(0.5);

        // 进度条背景
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a3a);
        barBg.fillRect(width / 2 - 150, height / 2, 300, 20);

        const progressBar = this.add.graphics();

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00f0ff);
            progressBar.fillRect(width / 2 - 148, height / 2 + 2, 296 * value, 16);
        });
    }

    create() {
        // 生成所有纹理
        const textureGen = new TextureGenerator(this);
        textureGen.generateAll();

        // 短暂延迟后进入菜单
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}