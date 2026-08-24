/**
 * 伤害数字显示
 * 静态方法，在指定位置显示浮动伤害数字，向上飘动并淡出
 * 暴击时数字更大且为红色
 */

import { CONFIG } from '../config.js';

export class DamageNumber {
  /**
   * 在指定位置显示伤害数字
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 位置x
   * @param {number} y - 位置y
   * @param {number} amount - 伤害数值
   * @param {number} color - 颜色（十六进制字符串，默认白色）
   */
  static show(scene, x, y, amount, color) {
    if (!scene || amount <= 0) return;

    const isCrit = amount > 30;
    const colorStr = color || '#ffffff';
    const fontSize = isCrit ? '24px' : '14px';
    const strokeColor = isCrit ? '#ff0000' : '#000000';
    const textColor = isCrit ? '#ff4444' : colorStr;

    // 添加随机偏移避免重叠
    const offsetX = (Math.random() - 0.5) * 20;
    const startY = y - 10;

    const text = scene.add.text(x + offsetX, startY, Math.round(amount).toString(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: fontSize,
      fontStyle: 'bold',
      color: textColor,
      stroke: strokeColor,
      strokeThickness: 3,
      shadow: isCrit ? {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0000',
        blur: 10,
        fill: true,
      } : undefined,
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    // 浮动 + 淡出动画
    scene.tweens.add({
      targets: text,
      y: startY - 50,
      alpha: 0,
      scaleX: isCrit ? 1.5 : 1,
      scaleY: isCrit ? 1.5 : 1,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }
}