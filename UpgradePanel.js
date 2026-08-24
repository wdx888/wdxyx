/**
 * 强化选择面板
 * 半透明覆盖层 + 3个强化卡片，支持鼠标悬停/点击和键盘1/2/3选择
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';

/** 稀有度颜色映射 */
const RARITY_COLORS = {
  common: { color: '#00ff66', glow: '#00ff66' },
  rare: { color: '#00f0ff', glow: '#00f0ff' },
  epic: { color: '#aa00ff', glow: '#aa00ff' },
};

export class UpgradePanel {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {Array<object>} upgrades - 3个强化选项
   * @param {Function} onChoose - 选择回调 (index) => void
   */
  constructor(scene, upgrades, onChoose) {
    this.scene = scene;
    this.upgrades = upgrades;
    this.onChoose = onChoose;
    this.elements = [];
    this.container = null;
    this.selected = false;
  }

  /**
   * 创建面板
   */
  create() {
    if (this.selected) return;
    const { scene } = this;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0).setDepth(300);

    // 半透明黑色背景
    const overlay = scene.add.rectangle(
      CONFIG.MAP_WIDTH / 2, CONFIG.MAP_HEIGHT / 2,
      CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT,
      0x000000, 0.7
    );
    overlay.setInteractive(); // 阻止点击穿透
    this.container.add(overlay);

    // 标题
    const title = scene.add.text(CONFIG.MAP_WIDTH / 2, 80, '选择强化', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#00f0ff',
        blur: 15,
        fill: true,
      },
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // 构建3个强化卡片
    const cardWidth = 240;
    const cardHeight = 120;
    const cardGap = 30;
    const totalWidth = this.upgrades.length * cardWidth + (this.upgrades.length - 1) * cardGap;
    const startX = (CONFIG.MAP_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cardY = CONFIG.MAP_HEIGHT / 2 + 20;

    for (let i = 0; i < this.upgrades.length; i++) {
      const upgrade = this.upgrades[i];
      const cardX = startX + i * (cardWidth + cardGap);
      const rarityInfo = RARITY_COLORS[upgrade.rarity] || RARITY_COLORS.common;

      const cardContainer = scene.add.container(cardX, cardY);
      this.container.add(cardContainer);

      // 卡片背景
      const bg = scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x0a0a2a, 0.9);
      bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(rarityInfo.color).color);
      cardContainer.add(bg);

      // 稀有度标签
      const rarityLabel = scene.add.text(0, -cardHeight / 2 + 14, upgrade.rarity.toUpperCase(), {
        fontFamily: 'Orbitron, monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: rarityInfo.color,
      });
      rarityLabel.setOrigin(0.5);
      cardContainer.add(rarityLabel);

      // 强化名称
      const nameText = scene.add.text(0, -15, upgrade.name, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      });
      nameText.setOrigin(0.5);
      cardContainer.add(nameText);

      // 描述
      const descText = scene.add.text(0, 22, upgrade.description, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: cardWidth - 20 },
      });
      descText.setOrigin(0.5);
      cardContainer.add(descText);

      // 快捷键提示
      const keyHint = scene.add.text(0, cardHeight / 2 - 14, '[' + (i + 1) + ']', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: rarityInfo.color,
      });
      keyHint.setOrigin(0.5);
      cardContainer.add(keyHint);

      // 交互区域
      const hitArea = scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0);
      hitArea.setInteractive({ useHandCursor: true });
      cardContainer.add(hitArea);

      // 悬停效果
      hitArea.on('pointerover', () => {
        scene.tweens.add({
          targets: cardContainer,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 150,
          ease: 'Power2',
        });
        bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(rarityInfo.glow).color);
        // 发光效果
        bg.setFillStyle(0x1a1a4a, 0.9);
      });

      hitArea.on('pointerout', () => {
        scene.tweens.add({
          targets: cardContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2',
        });
        bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(rarityInfo.color).color);
        bg.setFillStyle(0x0a0a2a, 0.9);
      });

      // 点击选择
      hitArea.on('pointerdown', () => {
        this.select(i);
      });

      this.elements.push({
        container: cardContainer,
        bg: bg,
        rarityInfo,
      });
    }

    // 键盘选择：1/2/3
    this.keyHandler = (event) => {
      const keyMap = { '1': 0, '2': 1, '3': 2 };
      const index = keyMap[event.key];
      if (index !== undefined && index < this.upgrades.length) {
        this.select(index);
      }
    };

    if (scene.input && scene.input.keyboard) {
      scene.input.keyboard.on('keydown', this.keyHandler);
    }

    // 入场动画：卡片从底部滑入
    for (let i = 0; i < this.elements.length; i++) {
      const card = this.elements[i].container;
      const targetY = card.y;
      card.y = CONFIG.MAP_HEIGHT + 100;
      card.setAlpha(0);

      scene.tweens.add({
        targets: card,
        y: targetY,
        alpha: 1,
        duration: 400,
        ease: 'Back.easeOut',
        delay: i * 100,
      });
    }
  }

  /**
   * 选择第index个强化
   * @param {number} index - 强化索引
   */
  select(index) {
    if (this.selected) return;
    this.selected = true;

    // 选中动画
    const chosen = this.elements[index];
    if (chosen) {
      this.scene.tweens.add({
        targets: chosen.container,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
      });

      // 其他卡片淡出
      for (let i = 0; i < this.elements.length; i++) {
        if (i === index) continue;
        this.scene.tweens.add({
          targets: this.elements[i].container,
          alpha: 0,
          duration: 200,
        });
      }
    }

    // 延迟触发回调
    this.scene.time.delayedCall(300, () => {
      // 通知事件总线
      eventBus.emit(eventBus.EVENTS.UPGRADE_CHOOSE, this.upgrades[index]);

      // 调用回调
      if (this.onChoose) {
        this.onChoose(index);
      }

      this.destroy();
    });
  }

  /**
   * 隐藏面板
   */
  hide() {
    if (this.container) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 200,
        onComplete: () => this.destroy(),
      });
    }
  }

  /**
   * 清理
   */
  destroy() {
    if (this.scene.input && this.scene.input.keyboard && this.keyHandler) {
      this.scene.input.keyboard.off('keydown', this.keyHandler);
    }

    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }

    this.elements = [];
  }
}