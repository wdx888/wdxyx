/**
 * 粒子特效管理器
 * 提供爆炸、拖尾、枪口闪光、伤害数字、升级特效、Boss出场、基地受损、屏幕震动、击杀慢动作等特效
 */

import { CONFIG } from '../config.js';

export class ParticleManager {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
    this.hitStopActive = false;
  }

  /**
   * 创建爆炸粒子效果
   * @param {number} x - 中心x
   * @param {number} y - 中心y
   * @param {number} color - 颜色（十六进制）
   * @param {number} scale - 缩放比例（默认1）
   */
  createExplosion(x, y, color = 0xff6600, scale = 1) {
    // 中心白光脉冲
    const flash = this.scene.add.circle(x, y, 10 * scale, 0xffffff, 0.9);
    flash.setDepth(15);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // 彩色粒子扩散
    const particleCount = Math.floor(12 * scale);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 20 * scale + Math.random() * 20 * scale;
      const particle = this.scene.add.circle(x, y, 2 * scale, color, 1);
      particle.setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // 暗色烟雾
    const smokeCount = Math.floor(5 * scale);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 15;
      const smoke = this.scene.add.circle(x, y, 3, 0x333333, 0.5);
      smoke.setDepth(14);

      this.scene.tweens.add({
        targets: smoke,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => smoke.destroy(),
      });
    }
  }

  /**
   * 子弹拖尾粒子
   * @param {number} x - 位置x
   * @param {number} y - 位置y
   * @param {number} color - 颜色
   */
  createBulletTrail(x, y, color = 0x00f0ff) {
    const trail = this.scene.add.circle(x, y, 1.5, color, 0.5);
    trail.setDepth(4);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 200,
      ease: 'Power2',
      onComplete: () => trail.destroy(),
    });
  }

  /**
   * 枪口闪光
   * @param {number} x - 枪口x
   * @param {number} y - 枪口y
   * @param {number} angle - 发射角度（弧度）
   * @param {number} color - 颜色
   */
  createMuzzleFlash(x, y, angle, color = 0xffff00) {
    // 主闪光
    const flash = this.scene.add.circle(x, y, 4, 0xffffff, 0.9);
    flash.setDepth(15);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 100,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // 锥形粒子
    const sparkCount = 5;
    for (let i = 0; i < sparkCount; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const sparkAngle = angle + spread;
      const spark = this.scene.add.circle(x, y, 1.5, color, 0.8);
      spark.setDepth(15);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(sparkAngle) * (10 + Math.random() * 15),
        y: y + Math.sin(sparkAngle) * (10 + Math.random() * 15),
        alpha: 0,
        duration: 150,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /**
   * 伤害数字显示
   * @param {number} x - 位置x
   * @param {number} y - 位置y
   * @param {number} amount - 伤害数值
   * @param {number} color - 颜色（十六进制数值）
   */
  createDamageNumber(x, y, amount, color = 0xffffff) {
    const text = this.scene.add.text(x, y, amount.toString(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: amount > 30 ? '20px' : '14px',
      fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /**
   * 升级金色粒子环绕效果
   * @param {number} x - 中心x
   * @param {number} y - 中心y
   */
  createUpgradeEffect(x, y) {
    const particleCount = 12;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const p = this.scene.add.circle(
        x + Math.cos(angle) * 40,
        y + Math.sin(angle) * 40,
        3,
        0xffd700,
        1
      );
      p.setDepth(20);
      p._angle = angle;
      p._radius = 40;
      particles.push(p);
    }

    // 旋转上升
    let elapsed = 0;
    const timer = this.scene.time.addEvent({
      delay: 30,
      repeat: 50,
      callback: () => {
        elapsed += 30;
        for (const p of particles) {
          if (!p.active) continue;
          p._angle += 0.05;
          p._radius += 0.5;
          p.x = x + Math.cos(p._angle) * p._radius;
          p.y = y + Math.sin(p._angle) * p._radius - elapsed * 0.3;
          p.alpha = 1 - elapsed / 1500;
        }
      },
    });

    this.scene.time.delayedCall(1500, () => {
      for (const p of particles) {
        if (p.active) p.destroy();
      }
    });
  }

  /**
   * Boss出场全屏效果
   * @param {number} x - Boss位置x
   * @param {number} y - Boss位置y
   */
  createBossEntrance(x, y) {
    // 屏幕边缘向内收缩的暗色边框
    const margin = 30;
    const { MAP_WIDTH, MAP_HEIGHT } = CONFIG;

    // 顶部
    const topBar = this.scene.add.rectangle(MAP_WIDTH / 2, 0, MAP_WIDTH, margin, 0x000000, 0.9);
    topBar.setDepth(30);
    topBar.setScrollFactor(0);

    // 底部
    const bottomBar = this.scene.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT, MAP_WIDTH, margin, 0x000000, 0.9);
    bottomBar.setDepth(30);
    bottomBar.setScrollFactor(0);

    // 左侧
    const leftBar = this.scene.add.rectangle(0, MAP_HEIGHT / 2, margin, MAP_HEIGHT, 0x000000, 0.9);
    leftBar.setDepth(30);
    leftBar.setScrollFactor(0);

    // 右侧
    const rightBar = this.scene.add.rectangle(MAP_WIDTH, MAP_HEIGHT / 2, margin, MAP_HEIGHT, 0x000000, 0.9);
    rightBar.setDepth(30);
    rightBar.setScrollFactor(0);

    // 收缩动画
    const targets = [topBar, bottomBar, leftBar, rightBar];
    // 先将它们移到屏幕外，然后收缩到边缘
    topBar.y = -margin;
    bottomBar.y = MAP_HEIGHT + margin;
    leftBar.x = -margin;
    rightBar.x = MAP_WIDTH + margin;

    this.scene.tweens.add({
      targets: topBar,
      y: 0,
      duration: 500,
      ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: bottomBar,
      y: MAP_HEIGHT,
      duration: 500,
      ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: leftBar,
      x: 0,
      duration: 500,
      ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: rightBar,
      x: MAP_WIDTH,
      duration: 500,
      ease: 'Power2',
    });

    // 收缩后延迟消去
    this.scene.time.delayedCall(1500, () => {
      for (const bar of targets) {
        this.scene.tweens.add({
          targets: bar,
          alpha: 0,
          duration: 500,
          onComplete: () => bar.destroy(),
        });
      }
    });

    // 全屏震动
    this.screenShake(CONFIG.SCREEN_SHAKE_INTENSITY * 2, 500);
  }

  /**
   * 基地受损红色脉冲
   * @param {object} base - 基地对象
   */
  createBaseDamageEffect(base) {
    if (!base || !base.active) return;

    // 红色脉冲环
    const ring = this.scene.add.circle(base.x, base.y, 20, 0xff0000, 0);
    ring.setStrokeStyle(3, 0xff0000, 0.8);
    ring.setDepth(10);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });

    // 红色覆盖闪烁
    const overlay = this.scene.add.circle(base.x, base.y, 24, 0xff0000, 0.3);
    overlay.setDepth(9);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => overlay.destroy(),
    });
  }

  /**
   * 屏幕震动
   * @param {number} intensity - 震动强度（默认CONFIG中值）
   * @param {number} duration - 持续时间（毫秒）
   */
  screenShake(intensity = CONFIG.SCREEN_SHAKE_INTENSITY, duration = CONFIG.SCREEN_SHAKE_DURATION) {
    this.scene.cameras.main.shake(duration, intensity * 0.01);
  }

  /**
   * 击杀慢动作（时间缩放）
   * @param {number} duration - 持续时间（毫秒，默认CONFIG中值）
   */
  hitStop(duration = CONFIG.HIT_STOP_DURATION) {
    if (this.hitStopActive) return;

    this.hitStopActive = true;
    this.scene.time.timeScale = 0.1;

    this.scene.time.delayedCall(duration, () => {
      this.scene.time.timeScale = 1;
      this.hitStopActive = false;
    });
  }
}