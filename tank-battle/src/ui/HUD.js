/**
 * 抬头显示（HUD）
 * 使用Phaser Text对象，固定在屏幕上显示波次、生命、武器、分数、基地血条等信息
 * 所有UI元素使用 setScrollFactor(0) 固定在屏幕上
 */

import { CONFIG } from '../config.js';

export class HUD {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
  }

  /**
   * 创建所有UI元素
   */
  create() {
    const { scene } = this;
    const fontStyle = {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: '#00f0ff',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // ===== 左上角：波次显示 =====
    this.elements.waveText = scene.add.text(16, 16, 'WAVE 1', {
      ...fontStyle,
      fontSize: '22px',
      fontStyle: 'bold',
    });
    this.elements.waveText.setScrollFactor(0).setDepth(100);

    // ===== 左下角：生命值 =====
    this.elements.healthContainer = scene.add.container(16, CONFIG.MAP_HEIGHT - 40);
    this.elements.healthContainer.setScrollFactor(0).setDepth(100);

    this.elements.healthLabel = scene.add.text(0, 0, 'HP', {
      ...fontStyle,
      fontSize: '12px',
    });
    this.elements.healthContainer.add(this.elements.healthLabel);

    // 生命值方块
    this.elements.healthBlocks = [];
    for (let i = 0; i < CONFIG.PLAYER_MAX_HEALTH; i++) {
      const block = scene.add.rectangle(30 + i * 18, 0, 14, 14, CONFIG.COLORS.NEON_GREEN);
      block.setStrokeStyle(1, 0x00aa00);
      this.elements.healthContainer.add(block);
      this.elements.healthBlocks.push(block);
    }

    // ===== 底部中央：武器栏 =====
    this.elements.weaponContainer = scene.add.container(CONFIG.MAP_WIDTH / 2, CONFIG.MAP_HEIGHT - 60);
    this.elements.weaponContainer.setScrollFactor(0).setDepth(100);

    this.elements.weaponSlots = [];
    for (let i = 0; i < 2; i++) {
      const slotX = (i - 0.5) * 100;
      const slotBg = scene.add.rectangle(slotX, 0, 90, 36, 0x111133, 0.8);
      slotBg.setStrokeStyle(1, CONFIG.COLORS.NEON_BLUE);
      this.elements.weaponContainer.add(slotBg);

      const slotName = scene.add.text(slotX, -4, '', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        color: '#888888',
        align: 'center',
      });
      slotName.setOrigin(0.5);
      this.elements.weaponContainer.add(slotName);

      // 冷却覆盖层
      const cooldownOverlay = scene.add.rectangle(slotX, 0, 90, 36, 0x000000, 0.5);
      cooldownOverlay.setVisible(false);
      this.elements.weaponContainer.add(cooldownOverlay);

      this.elements.weaponSlots.push({
        bg: slotBg,
        name: slotName,
        cooldown: cooldownOverlay,
      });
    }

    // 武器切换提示
    this.elements.weaponHint = scene.add.text(0, 24, 'Q/E 切换', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '9px',
      color: '#666688',
      align: 'center',
    });
    this.elements.weaponHint.setOrigin(0.5);
    this.elements.weaponContainer.add(this.elements.weaponHint);

    // ===== 右上角：分数 =====
    this.elements.scoreText = scene.add.text(CONFIG.MAP_WIDTH - 16, 16, 'SCORE: 0', {
      ...fontStyle,
      fontSize: '18px',
      color: '#ffd700',
    });
    this.elements.scoreText.setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // ===== 底部：基地血条 =====
    const baseBarY = CONFIG.MAP_HEIGHT - 12;
    this.elements.baseBarBg = scene.add.rectangle(CONFIG.MAP_WIDTH / 2, baseBarY, 200, 8, 0x333333, 0.8);
    this.elements.baseBarBg.setScrollFactor(0).setDepth(100);

    this.elements.baseBarFill = scene.add.rectangle(
      CONFIG.MAP_WIDTH / 2 - 100, baseBarY, 200, 8, CONFIG.COLORS.NEON_GREEN
    );
    this.elements.baseBarFill.setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);

    this.elements.baseBarBorder = scene.add.rectangle(CONFIG.MAP_WIDTH / 2, baseBarY, 200, 8);
    this.elements.baseBarBorder.setStrokeStyle(1, 0xffffff, 0.4);
    this.elements.baseBarBorder.setFillStyle(0, 0);
    this.elements.baseBarBorder.setScrollFactor(0).setDepth(100);

    this.elements.baseLabel = scene.add.text(CONFIG.MAP_WIDTH / 2, baseBarY - 10, 'BASE', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '9px',
      color: '#00f0ff',
    });
    this.elements.baseLabel.setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // ===== 波次公告横幅（初始隐藏） =====
    this.elements.waveAnnouncement = scene.add.text(CONFIG.MAP_WIDTH / 2, CONFIG.MAP_HEIGHT / 2, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00f0ff',
        blur: 20,
        fill: true,
      },
    });
    this.elements.waveAnnouncement.setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    // ===== Boss警告横幅（初始隐藏） =====
    this.elements.bossWarning = scene.add.text(CONFIG.MAP_WIDTH / 2, CONFIG.MAP_HEIGHT / 2 - 50, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff0044',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0044',
        blur: 30,
        fill: true,
      },
    });
    this.elements.bossWarning.setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
  }

  /**
   * 更新波次文字
   * @param {number} wave - 波次数
   */
  updateWave(wave) {
    if (this.elements.waveText) {
      this.elements.waveText.setText('WAVE ' + wave);
    }
  }

  /**
   * 更新生命值显示
   * @param {number} health - 当前生命
   * @param {number} maxHealth - 最大生命
   */
  updateHealth(health, maxHealth) {
    for (let i = 0; i < this.elements.healthBlocks.length; i++) {
      const block = this.elements.healthBlocks[i];
      if (i < maxHealth) {
        block.setVisible(true);
        if (i < health) {
          block.setFillStyle(CONFIG.COLORS.NEON_GREEN);
        } else {
          block.setFillStyle(CONFIG.COLORS.NEON_RED);
        }
      } else {
        block.setVisible(false);
      }
    }
  }

  /**
   * 更新武器栏
   * @param {Array<object>} weapons - 武器数据数组
   * @param {number} activeIndex - 当前激活武器索引
   */
  updateWeapons(weapons, activeIndex) {
    for (let i = 0; i < this.elements.weaponSlots.length; i++) {
      const slot = this.elements.weaponSlots[i];
      if (!slot) continue;

      if (i < weapons.length) {
        slot.bg.setVisible(true);
        slot.name.setVisible(true);
        slot.name.setText(weapons[i].name);

        if (i === activeIndex) {
          // 当前激活武器高亮
          slot.bg.setStrokeStyle(2, CONFIG.COLORS.NEON_BLUE);
          slot.name.setColor('#00f0ff');
        } else {
          slot.bg.setStrokeStyle(1, CONFIG.COLORS.NEON_BLUE, 0.4);
          slot.name.setColor('#888888');
        }
      } else {
        slot.bg.setVisible(false);
        slot.name.setVisible(false);
      }
    }
  }

  /**
   * 更新分数
   * @param {number} score - 分数
   */
  updateScore(score) {
    if (this.elements.scoreText) {
      this.elements.scoreText.setText('SCORE: ' + score);
    }
  }

  /**
   * 更新基地血条
   * @param {number} health - 当前生命
   * @param {number} maxHealth - 最大生命
   */
  updateBaseHealth(health, maxHealth) {
    if (this.elements.baseBarFill) {
      const percent = Math.max(0, health / maxHealth);
      const barWidth = 200 * percent;
      this.elements.baseBarFill.width = barWidth;

      // 颜色随血量变化
      if (percent > 0.5) {
        this.elements.baseBarFill.setFillStyle(CONFIG.COLORS.NEON_GREEN);
      } else if (percent > 0.25) {
        this.elements.baseBarFill.setFillStyle(0xffff00);
      } else {
        this.elements.baseBarFill.setFillStyle(CONFIG.COLORS.NEON_RED);
      }
    }
  }

  /**
   * 显示波次公告
   * @param {number} wave - 波次数
   */
  showWaveAnnouncement(wave) {
    const text = this.elements.waveAnnouncement;
    if (!text) return;

    text.setText('WAVE ' + wave);
    text.setAlpha(1);
    text.setScale(1.5);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      delay: 500,
    });
  }

  /**
   * 显示Boss警告
   * @param {string} bossName - Boss名称
   */
  showBossWarning(bossName) {
    const text = this.elements.bossWarning;
    if (!text) return;

    text.setText('⚠ ' + bossName + ' ⚠');
    text.setAlpha(1);
    text.setScale(0.5);

    // 闪烁警告
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 500,
        });
      },
    });
  }

  /**
   * 清理
   */
  destroy() {
    for (const key in this.elements) {
      const el = this.elements[key];
      if (!el) continue;
      if (Array.isArray(el)) {
        el.forEach(e => { if (e && e.destroy) e.destroy(); });
      } else if (el.destroy) {
        el.destroy();
      } else if (el instanceof Phaser.GameObjects.Container) {
        el.destroy(true);
      }
    }
    this.elements = {};
  }
}