/**
 * 强化选择场景（覆盖在GameScene之上）
 * 波次间隙弹出，展示3个随机强化卡片供玩家选择
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { UpgradePanel } from '../ui/UpgradePanel.js';

export class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    init() {
        // 获取GameScene引用
        this.gameScene = this.scene.get('GameScene');
    }

    create() {
        if (!this.gameScene) {
            this.scene.stop();
            return;
        }

        // 暂停GameScene
        this.gameScene.physics.pause();
        this.gameScene.isPaused = true;

        // 获取3个随机强化选项
        const upgrades = this.gameScene.upgradeManager.getRandomUpgrades(
            CONFIG.UPGRADE_OPTIONS_COUNT
        );

        if (!upgrades || upgrades.length === 0) {
            this.closeScene();
            return;
        }

        // 创建强化选择面板
        this.upgradePanel = new UpgradePanel(this, upgrades, (index) => {
            const upgrade = upgrades[index];
            if (!upgrade) return;

            // 应用强化到玩家
            this.gameScene.upgradeManager.applyUpgrade(
                upgrade,
                this.gameScene.player
            );

            // 延迟关闭场景
            this.time.delayedCall(500, () => {
                this.closeScene();
            });
        });
        this.upgradePanel.create();
    }

    /**
     * 关闭强化场景，恢复GameScene
     */
    closeScene() {
        if (this.gameScene) {
            this.gameScene.physics.resume();
            this.gameScene.isPaused = false;
        }
        this.scene.stop();
    }
}