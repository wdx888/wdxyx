/**
 * 战争巨像Boss（第10波）
 * 固定在屏幕上方中央，不移动，大型炮台
 * P1: 双肩轮射导弹，胸部激光
 * P2: 360°弹幕(12发)，召唤4个浮游炮塔(小敌人)，追踪光球
 * P3: 全屏密集弹幕，核心暴露期(3秒内受伤2x)
 */

import { BossBase } from './BossBase.js';
import { angleBetween, distanceBetween } from '../../utils/MathUtils.js';

export class Colossus extends BossBase {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, {
      texture: 'boss_colossus',
      maxHealth: 600,
      speed: 0,
      name: '战争巨像',
      phases: [
        {
          threshold: 0.66,
          attacks: ['missileBarrage', 'laserSweep'],
        },
        {
          threshold: 0.33,
          attacks: ['bulletCircle', 'spawnMinions', 'orbitalLasers'],
        },
        {
          threshold: 0,
          attacks: ['fullScreenBulletHell', 'chargeAttack', 'scatterShot'],
        },
      ],
    });

    // 重写弹幕数量
    this._bulletCircleCount = 12;
    this._orbitalLasersCount = 4;

    // 双肩导弹轮射
    this.shoulderSide = 0; // 0=左肩, 1=右肩

    // 自爆倒计时
    this.selfDestructTimer = -1;
    this.selfDestructWarning = false;
  }

  /**
   * 移动逻辑：固定位置，不移动
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  updateMovement(time, delta) {
    // 战争巨像固定在屏幕上方中央，不移动
    this.sprite.setVelocity(0, 0);

    // P3自爆倒计时
    if (this.currentPhaseIndex >= 2 && this.selfDestructTimer < 0) {
      this.selfDestructTimer = 20000; // 20秒倒计时
      this.selfDestructWarning = true;
    }

    if (this.selfDestructTimer > 0) {
      this.selfDestructTimer -= delta;

      // 倒计时警告闪烁
      if (this.selfDestructTimer < 5000) {
        this.sprite.setTint(
          Math.floor(this.scene.time.now / 200) % 2 === 0 ? 0xff0000 : 0xffffff
        );
      }

      if (this.selfDestructTimer <= 0) {
        // 自爆
        this.selfDestruct();
      }
    }
  }

  /**
   * 执行攻击模式（覆盖以处理导弹轮射）
   * @param {string} attack - 攻击名称
   */
  executeAttack(attack) {
    if (attack === 'bulletCircle') {
      this.bulletCircle(this._bulletCircleCount);
    } else if (attack === 'spawnMinions') {
      this.spawnMinions('assault', 4);
    } else if (attack === 'missileBarrage') {
      this.shoulderMissileBarrage();
    } else {
      super.executeAttack(attack);
    }
  }

  /**
   * 双肩轮射导弹 — 交替从左肩和右肩发射追踪导弹
   */
  shoulderMissileBarrage() {
    if (!this.player || !this.player.active) return;

    // 交替从左右肩发射
    const shoulder = this.shoulderSide;
    this.shoulderSide = 1 - this.shoulderSide;

    const offsetX = shoulder === 0 ? -30 : 30;
    const offsetY = -20;

    const missileCount = 4;
    for (let i = 0; i < missileCount; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.sprite.active) return;
        const angle = angleBetween(
          this.sprite.x + offsetX,
          this.sprite.y + offsetY,
          this.player.x,
          this.player.y
        );

        // 从肩部发射追踪导弹
        const missile = this.scene.enemyBullets.create(
          this.sprite.x + offsetX,
          this.sprite.y + offsetY,
          'bullet_missile'
        );
        if (!missile) return;

        missile.setRotation(angle);
        missile.setVelocity(
          Math.cos(angle) * 200,
          Math.sin(angle) * 200
        );
        missile.damage = 25;
        missile.isPlayerBullet = false;
        missile.lifespan = 3000;
        missile.spawnTime = this.scene.time.now;
        missile.setDepth(10);
      });
    }
  }

  /**
   * 自爆
   */
  selfDestruct() {
    // 巨大爆炸粒子
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 60 + Math.random() * 80;
      const particle = this.scene.add.circle(
        this.sprite.x, this.sprite.y,
        5,
        0xff4400,
        1
      );
      particle.setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: this.sprite.x + Math.cos(angle) * dist,
        y: this.sprite.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // 全屏伤害
    if (this.player && this.player.active) {
      const dist = distanceBetween(this.sprite.x, this.sprite.y, this.player.x, this.player.y);
      if (dist < 200) {
        this.player.takeDamage(50);
      }
    }

    // 屏幕强震动
    this.scene.cameras.main.shake(500, 0.02);

    this.die();
  }
}