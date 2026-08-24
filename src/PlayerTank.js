/**
 * 玩家坦克类
 * 继承Phaser.Physics.Arcade.Sprite，处理玩家移动、瞄准、射击、武器切换、受伤等逻辑
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { angleBetween, distanceBetween, clamp } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/weapons.js';
import { Bullet } from './Bullet.js';

export class PlayerTank extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'player_tank');

    // 加入场景并启用物理
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 物理属性：碰撞体略小于精灵，方便移动
    this.setSize(22, 22);
    this.setOffset(5, 5);
    this.setCollideWorldBounds(true);

    // 生命值
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;

    // 移动速度
    this.speed = CONFIG.PLAYER_SPEED;

    // 武器系统
    this.weapons = [WEAPONS.plasma];
    this.activeWeaponIndex = 0;
    this.maxWeapons = 2;
    this.lastFireTime = 0;

    // 无敌状态
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = CONFIG.PLAYER_INVINCIBLE_TIME;

    // 强化效果
    this.buffs = {};

    // 移动方向
    this.moveDirection = { x: 0, y: 0 };

    // 瞄准角度（面向鼠标/自动瞄准方向）
    this.aimAngle = -Math.PI / 2; // 默认朝上

    // 开火状态
    this.isFiring = false;

    // 设置深度
    this.setDepth(10);
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  update(time, delta) {
    // 处理移动
    this.applyMovement();

    // 处理持续开火
    if (this.isFiring) {
      this.shoot(time, delta);
    }

    // 无敌计时
    if (this.invincible) {
      this.invincibleTimer -= delta;
      // 闪烁效果
      this.alpha = Math.sin(time * 0.02) > 0 ? 1 : 0.3;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.alpha = 1;
      }
    }
  }

  /**
   * 应用移动方向
   */
  applyMovement() {
    const { x: dx, y: dy } = this.moveDirection;
    if (dx === 0 && dy === 0) {
      this.setVelocity(0, 0);
      return;
    }

    // 归一化方向向量
    const len = Math.sqrt(dx * dx + dy * dy);
    const speedMultiplier = this.buffs['speed_boost'] || 0;
    const currentSpeed = this.speed * (1 + speedMultiplier);

    this.setVelocity(
      (dx / len) * currentSpeed,
      (dy / len) * currentSpeed
    );
  }

  /**
   * 键盘移动处理
   * @param {object} cursors - 方向键对象
   * @param {object} wasd - WASD键对象
   */
  handleMovement(cursors, wasd) {
    this.moveDirection.x = 0;
    this.moveDirection.y = 0;

    if (cursors.left.isDown || wasd.left.isDown) this.moveDirection.x -= 1;
    if (cursors.right.isDown || wasd.right.isDown) this.moveDirection.x += 1;
    if (cursors.up.isDown || wasd.up.isDown) this.moveDirection.y -= 1;
    if (cursors.down.isDown || wasd.down.isDown) this.moveDirection.y += 1;
  }

  /**
   * 鼠标瞄准，计算角度
   * @param {Phaser.Input.Pointer} pointer - 鼠标指针
   */
  handleAim(pointer) {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.aimAngle = angleBetween(this.x, this.y, worldPoint.x, worldPoint.y);
    this.setRotation(this.aimAngle + Math.PI / 2);

    // 瞄准十字准星
    if (!this.aimCrosshair) {
      this.aimCrosshair = this.scene.add.graphics();
      this.aimCrosshair.setDepth(20);
    }
    this.aimCrosshair.clear();
    const cx = worldPoint.x, cy = worldPoint.y;
    const isFiring = this.scene.isShooting || this.scene.spaceKey.isDown || this.scene.input.activePointer.isDown;
    const color = isFiring ? 0xff4444 : 0x00f0ff;
    this.aimCrosshair.lineStyle(1, color, 0.6);
    this.aimCrosshair.lineBetween(cx - 8, cy, cx - 4, cy);
    this.aimCrosshair.lineBetween(cx + 4, cy, cx + 8, cy);
    this.aimCrosshair.lineBetween(cx, cy - 8, cx, cy - 4);
    this.aimCrosshair.lineBetween(cx, cy + 4, cx, cy + 8);
    this.aimCrosshair.strokeCircle(cx, cy, 12);
  }

  /**
   * 开火
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  shoot(time, delta) {
    const weapon = this.weapons[this.activeWeaponIndex];
    if (!weapon) return;

    const fireRate = weapon.fireRate;
    // 检查冷却
    if (time - this.lastFireTime < fireRate) return;

    this.lastFireTime = time;

    // 炮口偏移位置（炮管末端）
    const barrelLength = 16;
    const muzzleX = this.x + Math.cos(this.aimAngle) * barrelLength;
    const muzzleY = this.y + Math.sin(this.aimAngle) * barrelLength;

    // 子弹数量加成
    const bulletPlus = this.buffs['bullet_plus'] || 0;
    const bulletCount = 1 + bulletPlus;

    if (bulletCount === 1) {
      // 单发
      const bullet = Bullet.fire(
        this.scene, muzzleX, muzzleY,
        weapon, this.aimAngle, true
      );
      this.scene.playerBullets.add(bullet);
    } else {
      // 多发散射
      const spreadAngle = 0.15; // 散射角度
      const startAngle = this.aimAngle - (spreadAngle * (bulletCount - 1)) / 2;
      for (let i = 0; i < bulletCount; i++) {
        const angle = startAngle + spreadAngle * i;
        const bullet = Bullet.fire(
          this.scene, muzzleX, muzzleY,
          weapon, angle, true
        );
        this.scene.playerBullets.add(bullet);
      }
    }
  }

  /**
   * 切换武器
   * @param {number} index - 武器索引（0或1）
   */
  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.activeWeaponIndex = index;
    }
  }

  /**
   * 添加武器
   * @param {string} weaponId - 武器ID
   */
  addWeapon(weaponId) {
    const weapon = WEAPONS[weaponId];
    if (!weapon) return false;

    // 检查是否已有该武器
    const exists = this.weapons.some(w => w.id === weaponId);
    if (exists) return false;

    if (this.weapons.length < this.maxWeapons) {
      this.weapons.push(weapon);
      return true;
    }

    return false;
  }

  /**
   * 受到伤害
   * @param {number} amount - 伤害值
   */
  takeDamage(amount) {
    if (this.invincible) return;

    // 护盾检查
    if (this.buffs['shield'] && this.buffs['shield'] > 0) {
      this.buffs['shield']--;
      // 护盾破碎特效
      this.createShieldBreakEffect();
      return;
    }

    this.health -= amount;
    this.health = Math.max(0, this.health);

    // 进入无敌状态
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;

    // 屏幕震动
    this.scene.cameras.main.shake(
      CONFIG.SCREEN_SHAKE_DURATION,
      CONFIG.SCREEN_SHAKE_INTENSITY * 0.01
    );

    // 受击粒子
    this.createHitEffect();

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.PLAYER_DAMAGE, this.health, this.maxHealth);

    // 生命值≤0时触发死亡
    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * 回血
   * @param {number} amount - 回复量
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * 应用强化效果
   * @param {object} buff - 强化数据 { id, value }
   */
  applyBuff(buff) {
    switch (buff.id) {
      case 'max_health':
        this.maxHealth += buff.value;
        this.health += buff.value;
        break;
      case 'speed_boost':
        if (!this.buffs['speed_boost']) this.buffs['speed_boost'] = 0;
        this.buffs['speed_boost'] += buff.value;
        break;
      case 'bullet_plus':
        if (!this.buffs['bullet_plus']) this.buffs['bullet_plus'] = 0;
        this.buffs['bullet_plus'] += buff.value;
        break;
      case 'shield':
        if (!this.buffs['shield']) this.buffs['shield'] = 0;
        this.buffs['shield'] += buff.value;
        break;
      case 'invincible_time':
        this.invincibleDuration += buff.value;
        break;
      default:
        // 其他buff存储
        if (!this.buffs[buff.id]) this.buffs[buff.id] = 0;
        this.buffs[buff.id] += buff.value;
        break;
    }
  }

  /**
   * 死亡处理
   */
  die() {
    // 死亡爆炸粒子
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 30 + Math.random() * 20;
      const particle = this.scene.add.circle(
        this.x, this.y,
        3,
        CONFIG.COLORS.PLAYER_GLOW,
        1
      );
      particle.setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.PLAYER_DEATH);

    this.setVisible(false);
    this.setActive(false);
    this.body.enable = false;
  }

  /**
   * 护盾破碎特效
   */
  createShieldBreakEffect() {
    const ring = this.scene.add.circle(this.x, this.y, 20, 0x00ffff, 0);
    ring.setStrokeStyle(2, 0x00ffff, 0.8);
    ring.setDepth(15);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        ring.destroy();
      },
    });
  }

  /**
   * 受击特效
   */
  createHitEffect() {
    const particles = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const p = this.scene.add.circle(
        this.x, this.y,
        2,
        CONFIG.COLORS.NEON_RED,
        1
      );
      p.setDepth(15);
      particles.push(p);

      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 15,
        y: this.y + Math.sin(angle) * 15,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          p.destroy();
        },
      });
    }
  }
}