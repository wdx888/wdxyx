/**
 * 子弹类
 * 继承Phaser.Physics.Arcade.Sprite，处理游戏中所有子弹逻辑
 * 支持等离子溅射、激光穿透、电磁炮穿透、追踪导弹等多种子弹类型
 */

import { CONFIG } from '../config.js';
import { angleBetween, distanceBetween, clamp, normalizeAngle } from '../utils/MathUtils.js';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 生成x坐标
   * @param {number} y - 生成y坐标
   * @param {object} weaponData - 武器数据（来自WEAPONS配置）
   * @param {number} angle - 发射角度（弧度）
   * @param {boolean} isPlayerBullet - 是否为玩家子弹
   */
  constructor(scene, x, y, weaponData, angle, isPlayerBullet) {
    const textureKey = 'bullet_' + weaponData.bulletType;
    super(scene, x, y, textureKey);

    // 加入场景并启用物理
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 确保物理体存在并正确设置
    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setSize(this.width * 0.8, this.height * 0.8);
    }

    // 武器属性
    this.damage = weaponData.damage;
    this.isPlayerBullet = isPlayerBullet;
    this.splash = weaponData.splash || false;
    this.splashRadius = weaponData.splashRadius || 0;
    this.pierce = weaponData.pierce || 0;
    this.pierceCount = 0;
    this.tracking = weaponData.tracking || false;
    this.trackingStrength = weaponData.trackingStrength || 0;
    this.trackingTarget = null;
    this.weaponData = weaponData;

    // 生命周期
    this.lifespan = 3000;
    this.spawnTime = scene.time.now;

    // 子弹速度
    this.bulletSpeed = weaponData.bulletSpeed;

    // 物理属性
    this.setRotation(angle);
    this.setVelocity(
      Math.cos(angle) * this.bulletSpeed,
      Math.sin(angle) * this.bulletSpeed
    );
    this.setDepth(8);

    // 拖尾计时器
    this.trailTimer = 0;

    // 枪口闪光效果
    this.createMuzzleFlash(x, y, angle, weaponData.color);
  }

  /**
   * 枪口闪光特效
   */
  createMuzzleFlash(x, y, angle, color) {
    const flash = this.scene.add.circle(x, y, 4, color || 0xffffff, 0.9);
    flash.setDepth(12);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * 静态工厂方法 - 创建并发射子弹
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 发射位置x
   * @param {number} y - 发射位置y
   * @param {object} weaponData - 武器数据
   * @param {number} angle - 发射角度（弧度）
   * @param {boolean} isPlayerBullet - 是否为玩家子弹
   * @returns {Bullet}
   */
  static fire(scene, x, y, weaponData, angle, isPlayerBullet) {
    return new Bullet(scene, x, y, weaponData, angle, isPlayerBullet);
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  update(time, delta) {
    if (!this.active) return;

    // 检查生命周期
    if (time - this.spawnTime > this.lifespan) {
      this.destroy();
      return;
    }

    // 追踪导弹逻辑
    if (this.tracking) {
      this.updateTracking();
    }

    // 拖尾粒子
    this.trailTimer += delta;
    if (this.trailTimer >= 50) {
      this.trailTimer = 0;
      this.createTrail();
    }

    // 超出边界销毁
    const bounds = 100;
    if (
      this.x < -bounds || this.x > CONFIG.MAP_WIDTH + bounds ||
      this.y < -bounds || this.y > CONFIG.MAP_HEIGHT + bounds
    ) {
      this.destroy();
    }
  }

  /**
   * 追踪导弹：每帧查找最近敌人，逐步调整角度追踪
   */
  updateTracking() {
    // 如果已有追踪目标，检查是否存活
    if (this.trackingTarget && !this.trackingTarget.active) {
      this.trackingTarget = null;
    }

    // 查找最近敌人
    if (!this.trackingTarget) {
      let closestDist = Infinity;
      let closestEnemy = null;

      const enemies = this.scene.enemies;
      if (enemies && enemies.getChildren) {
        const enemyList = enemies.getChildren();
        for (const enemy of enemyList) {
          if (!enemy.active) continue;
          const dist = distanceBetween(this.x, this.y, enemy.x, enemy.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
          }
        }
      }

      this.trackingTarget = closestEnemy;
    }

    // 向目标逐步转向
    if (this.trackingTarget && this.trackingTarget.active) {
      const targetAngle = angleBetween(
        this.x, this.y,
        this.trackingTarget.x, this.trackingTarget.y
      );

      // 获取当前角度
      let currentAngle = this.rotation;

      // 计算角度差（最短路径）
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // 逐步调整
      const newAngle = currentAngle + angleDiff * this.trackingStrength;
      this.setRotation(newAngle);
      this.setVelocity(
        Math.cos(newAngle) * this.bulletSpeed,
        Math.sin(newAngle) * this.bulletSpeed
      );
    }
  }

  /**
   * 子弹命中处理
   * 处理穿透计数和溅射伤害逻辑
   */
  onHit() {
    // 穿透：电磁炮/激光穿透多个敌人
    if (this.pierce) {
      this.pierceCount++;
      if (this.pierceCount >= this.pierce) {
        this.destroy();
      }
      return;
    }

    // 溅射：命中后40px范围伤害
    if (this.splash) {
      this.createSplash();
    }

    this.destroy();
  }

  /**
   * 创建溅射粒子效果
   */
  createSplash() {
    // 溅射粒子
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const particle = this.scene.add.circle(
        this.x, this.y,
        2,
        this.weaponData.color || 0x00f0ff,
        0.8
      );
      particle.setDepth(5);

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * this.splashRadius,
        y: this.y + Math.sin(angle) * this.splashRadius,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // 溅射范围伤害：对范围内的敌人造成伤害
    const enemies = this.scene.enemies;
    if (enemies && enemies.getChildren) {
      const enemyList = enemies.getChildren();
      for (const enemy of enemyList) {
        if (!enemy.active) continue;
        const dist = distanceBetween(this.x, this.y, enemy.x, enemy.y);
        if (dist <= this.splashRadius) {
          // 溅射伤害递减
          const falloff = 1 - (dist / this.splashRadius) * 0.5;
          const splashDamage = Math.floor(this.damage * falloff);
          if (enemy.takeDamage) {
            enemy.takeDamage(splashDamage);
          }
        }
      }
    }
  }

  /**
   * 创建拖尾粒子
   */
  createTrail() {
    const color = this.weaponData.color || 0xffffff;
    const trail = this.scene.add.circle(
      this.x, this.y,
      1.5,
      color,
      0.5
    );
    trail.setDepth(4);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        trail.destroy();
      },
    });
  }
}