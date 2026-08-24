/**
 * Boss血条
 * 屏幕顶部居中显示的大型Boss血条，包含阶段指示器和平滑过渡动画
 */

import { CONFIG } from '../config.js';

export class BossHealthBar {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {string} bossName - Boss名称
   * @param {number} maxHealth - Boss最大生命值
   */
  constructor(scene, bossName, maxHealth) {
    this.scene = scene;
    this.bossName = bossName;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.phaseIndex = 0;
    this.totalPhases = 1;
    this.displayWidth = 0;
    this.targetWidth = 0;

    // 血条尺寸
    this.barWidth = 400;
    this.barHeight = 14;
    this.barX = (CONFIG.MAP_WIDTH - this.barWidth) / 2;
    this.barY = 12;

    // 创建图形
    this.barBg = null;
    this.barFill = null;
    this.barBorder = null;
    this.nameText = null;
    this.phaseIndicators = [];
    this.container = null;

    this.create();
  }

  /**
   * 创建血条元素
   */
  create() {
    const { scene } = this;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0).setDepth(200);

    // Boss名称
    this.nameText = scene.add.text(CONFIG.MAP_WIDTH / 2, this.barY - 8, this.bossName, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5, 1);
    this.container.add(this.nameText);

    // 背景
    this.barBg = scene.add.rectangle(
      this.barX + this.barWidth / 2,
      this.barY + this.barHeight / 2,
      this.barWidth, this.barHeight,
      0x111111, 0.9
    );
    this.barBg.setStrokeStyle(1, 0x444444);
    this.container.add(this.barBg);

    // 血量填充
    this.barFill = scene.add.rectangle(
      this.barX, this.barY + this.barHeight / 2,
      this.barWidth, this.barHeight,
      0xff4444
    );
    this.barFill.setOrigin(0, 0.5);
    this.container.add(this.barFill);

    // 边框
    this.barBorder = scene.add.rectangle(
      this.barX + this.barWidth / 2,
      this.barY + this.barHeight / 2,
      this.barWidth, this.barHeight
    );
    this.barBorder.setStrokeStyle(2, 0xffffff, 0.6);
    this.barBorder.setFillStyle(0, 0);
    this.container.add(this.barBorder);

    this.targetWidth = this.barWidth;
    this.displayWidth = this.barWidth;

    // 初始隐藏
    this.container.setAlpha(0);
  }

  /**
   * 更新血量（带平滑过渡）
   * @param {number} currentHealth - 当前生命值
   * @param {number} maxHealth - 最大生命值
   */
  updateHealth(currentHealth, maxHealth) {
    this.currentHealth = currentHealth;
    this.maxHealth = maxHealth || this.maxHealth;

    const percent = Math.max(0, this.currentHealth / this.maxHealth);
    this.targetWidth = this.barWidth * percent;

    // 颜色渐变
    let color;
    if (percent > 0.5) {
      color = 0xff4444;
    } else if (percent > 0.25) {
      color = 0xff8800;
    } else {
      color = 0xff0000;
    }
    this.barFill.setFillStyle(color);
  }

  /**
   * 更新阶段指示器
   * @param {number} phaseIndex - 当前阶段索引（从0开始）
   * @param {number} totalPhases - 总阶段数
   */
  updatePhase(phaseIndex, totalPhases) {
    this.phaseIndex = phaseIndex;
    this.totalPhases = totalPhases || this.totalPhases;

    // 更新阶段分隔线
    if (totalPhases && totalPhases > 1) {
      for (let i = 0; i < this.phaseIndicators.length; i++) {
        this.phaseIndicators[i].destroy();
      }
      this.phaseIndicators = [];

      for (let i = 1; i < totalPhases; i++) {
        const threshold = 1 - i / totalPhases;
        const lineX = this.barX + this.barWidth * threshold;
        const line = this.scene.add.rectangle(lineX, this.barY + this.barHeight / 2, 2, this.barHeight + 4, 0xffffff, 0.5);
        line.setDepth(201);
        this.container.add(line);
        this.phaseIndicators.push(line);
      }
    }
  }

  /**
   * 显示血条
   */
  show() {
    this.container.setAlpha(1);
  }

  /**
   * 隐藏血条
   */
  hide() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
    });
  }

  /**
   * 每帧更新（平滑过渡血条宽度）
   */
  update() {
    // 平滑过渡
    this.displayWidth += (this.targetWidth - this.displayWidth) * 0.1;
    if (Math.abs(this.targetWidth - this.displayWidth) < 0.5) {
      this.displayWidth = this.targetWidth;
    }
    this.barFill.width = this.displayWidth;
  }

  /**
   * 清理
   */
  destroy() {
    for (const line of this.phaseIndicators) {
      if (line && line.destroy) line.destroy();
    }
    this.phaseIndicators = [];

    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
  }
}