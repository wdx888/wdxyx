/**
 * Boss基类
 * 封装Phaser.Physics.Arcade.Sprite，实现阶段系统、多种攻击模式
 * 子类：Scorpion（机械蝎）、Colossus（战争巨像）
 */

import { CONFIG } from '../../config.js';
import { eventBus } from '../utils/EventBus.js';
import { angleBetween, distanceBetween, clamp, normalizeAngle } from '../utils/MathUtils.js';
import { Bullet } from '../Bullet.js';

export class BossBase {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   * @param {object} config - Boss配置
   * @param {string} config.texture - 纹理键名
   * @param {number} config.maxHealth - 最大生命值
   * @param {number} config.speed - 移动速度
   * @param {Array} config.phases - 阶段配置 [{threshold: 0.5, attacks: [...]}, ...]
   * @param {string} config.name - Boss名称
   */
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.phases = config.phases;
    this.currentPhaseIndex = 0;
    this.phaseTransitioning = false;
    this.speed = config.speed;
    this.name = config.name;

    // 攻击计时
    this.attackTimer = 0;
    this.attackInterval = 3000;
    this.currentAttack = null;

    // 创建精灵
    this.sprite = scene.physics.add.sprite(x, y, config.texture);
    this.sprite.setImmovable(true);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.owner = this;
    this.sprite.health = config.maxHealth;
    this.sprite.maxHealth = config.maxHealth;
    this.sprite.boss = true;
    this.sprite.setDepth(11);

    // 引用
    this.player = scene.player;

    // 创建血条
    this.healthBar = this.createHealthBar();

    // 攻击模式索引
    this.attackIndex = 0;

    // 激光扫射相关
    this.laserGraphics = null;
    this.laserSweepAngle = 0;

    // 召唤计数
    this.minionsSpawned = 0;

    // 暴露状态（Colossus P3）
    this.exposed = false;
    this.exposedTimer = 0;
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  update(time, delta) {
    if (!this.sprite.active) return;

    // 阶段切换中
    if (this.phaseTransitioning) return;

    // 检查阶段切换
    this.checkPhaseTransition();

    // 攻击计时
    this.attackTimer += delta;
    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      this.executeCurrentPhaseAttack();
    }

    // 移动逻辑（子类可覆盖）
    this.updateMovement(time, delta);

    // 更新血条
    this.updateHealthBar();

    // 暴露状态计时（Colossus P3）
    if (this.exposed) {
      this.exposedTimer -= delta;
      if (this.exposedTimer <= 0) {
        this.exposed = false;
      }
    }
  }

  /**
   * 移动逻辑（子类可覆盖）
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  updateMovement(time, delta) {
    // 默认不移动，子类覆盖
  }

  /**
   * 检查阶段切换
   */
  checkPhaseTransition() {
    const healthPercent = this.health / this.maxHealth;

    for (let i = this.currentPhaseIndex + 1; i < this.phases.length; i++) {
      if (healthPercent <= this.phases[this.currentPhaseIndex].threshold) {
        this.transitionPhase(i);
        break;
      }
    }
  }

  /**
   * 切换阶段
   * @param {number} newPhaseIndex - 新阶段索引
   */
  transitionPhase(newPhaseIndex) {
    if (this.phaseTransitioning) return;

    this.phaseTransitioning = true;
    this.currentPhaseIndex = newPhaseIndex;

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.BOSS_PHASE_CHANGE, this.name, newPhaseIndex + 1);

    // 全屏闪烁
    this.scene.cameras.main.flash(500, 255, 255, 255, true);

    // 无敌过渡
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(1000, () => {
      this.phaseTransitioning = false;
      this.sprite.clearTint();
      this.attackTimer = 0;
    });

    // 攻击间隔缩短（越往后越快）
    this.attackInterval = Math.max(1500, 3000 - newPhaseIndex * 500);
  }

  /**
   * 执行当前阶段攻击
   */
  executeCurrentPhaseAttack() {
    if (this.currentPhaseIndex >= this.phases.length) return;

    const phase = this.phases[this.currentPhaseIndex];
    const attacks = phase.attacks;

    if (!attacks || attacks.length === 0) return;

    // 循环或随机选择攻击
    this.attackIndex = (this.attackIndex + 1) % attacks.length;
    const attackName = attacks[this.attackIndex];

    this.executeAttack(attackName);
  }

  /**
   * 执行具体攻击模式
   * @param {string} attack - 攻击名称
   */
  executeAttack(attack) {
    switch (attack) {
      case 'laserSweep':
        this.laserSweep();
        break;
      case 'scatterShot':
        this.scatterShot();
        break;
      case 'bulletCircle':
        this.bulletCircle(8);
        break;
      case 'spawnMinions':
        this.spawnMinions('bomber', 2);
        break;
      case 'chargeAttack':
        this.chargeAttack();
        break;
      case 'missileBarrage':
        this.missileBarrage();
        break;
      case 'orbitalLasers':
        this.orbitalLasers();
        break;
      case 'fullScreenBulletHell':
        this.fullScreenBulletHell();
        break;
    }
  }

  /**
   * 激光扫射
   */
  laserSweep() {
    if (!this.player || !this.player.active) return;

    const startAngle = 0;
    const endAngle = Math.PI;
    const duration = 1500;
    const laserLength = 500;
    const laserWidth = 3;

    // 创建激光图形
    if (this.laserGraphics) {
      this.laserGraphics.destroy();
    }
    this.laserGraphics = this.scene.add.graphics();
    this.laserGraphics.setDepth(12);

    let elapsed = 0;
    const timer = this.scene.time.addEvent({
      delay: 16,
      repeat: Math.floor(duration / 16),
      callback: () => {
        elapsed += 16;
        const progress = elapsed / duration;
        const currentAngle = startAngle + (endAngle - startAngle) * progress;

        this.laserGraphics.clear();
        const sx = this.sprite.x + Math.cos(currentAngle) * 20;
        const sy = this.sprite.y + Math.sin(currentAngle) * 20;
        const ex = sx + Math.cos(currentAngle) * laserLength;
        const ey = sy + Math.sin(currentAngle) * laserLength;

        // 激光束
        this.laserGraphics.lineStyle(laserWidth, 0xff0000, 0.8);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(sx, sy);
        this.laserGraphics.lineTo(ex, ey);
        this.laserGraphics.strokePath();

        // 外发光
        this.laserGraphics.lineStyle(laserWidth + 4, 0xff0000, 0.2);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(sx, sy);
        this.laserGraphics.lineTo(ex, ey);
        this.laserGraphics.strokePath();

        // 检测玩家是否在激光路径上
        const playerDist = distanceBetween(sx, sy, this.player.x, this.player.y);
        if (playerDist < laserLength) {
          const playerAngle = angleBetween(sx, sy, this.player.x, this.player.y);
          const angleDiff = Math.abs(playerAngle - currentAngle);
          if (angleDiff < 0.15) {
            this.player.takeDamage(1);
          }
        }
      },
    });

    // 清理
    this.scene.time.delayedCall(duration + 100, () => {
      if (this.laserGraphics) {
        this.laserGraphics.destroy();
        this.laserGraphics = null;
      }
    });
  }

  /**
   * 散射弹
   */
  scatterShot() {
    if (!this.player || !this.player.active) return;

    const angle = angleBetween(this.sprite.x, this.sprite.y, this.player.x, this.player.y);
    const bulletCount = 3;
    const spreadAngle = 0.25;

    const startAngle = angle - (spreadAngle * (bulletCount - 1)) / 2;
    for (let i = 0; i < bulletCount; i++) {
      const bulletAngle = startAngle + spreadAngle * i;
      const bullet = Bullet.fire(
        this.scene,
        this.sprite.x + Math.cos(bulletAngle) * 20,
        this.sprite.y + Math.sin(bulletAngle) * 20,
        { bulletType: 'plasma', bulletSpeed: 350, damage: 20, color: 0xff0000 },
        bulletAngle,
        false
      );
      this.scene.enemyBullets.add(bullet);
    }
  }

  /**
   * 360°弹幕圆环
   * @param {number} count - 子弹数量
   */
  bulletCircle(count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const bullet = Bullet.fire(
        this.scene,
        this.sprite.x + Math.cos(angle) * 20,
        this.sprite.y + Math.sin(angle) * 20,
        { bulletType: 'plasma', bulletSpeed: 200, damage: 15, color: 0xff4400 },
        angle,
        false
      );
      this.scene.enemyBullets.add(bullet);
    }
  }

  /**
   * 召唤小兵
   * @param {string} type - 敌人类型
   * @param {number} count - 数量
   */
  spawnMinions(type, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const spawnX = this.sprite.x + Math.cos(angle) * 60;
      const spawnY = this.sprite.y + Math.sin(angle) * 60;

      // 确保在边界内
      const cx = clamp(spawnX, 50, CONFIG.MAP_WIDTH - 50);
      const cy = clamp(spawnY, 50, CONFIG.MAP_HEIGHT - 50);

      // 通过场景方法生成敌人
      if (this.scene.spawnEnemy) {
        this.scene.spawnEnemy(type, cx, cy);
      }
    }
  }

  /**
   * 冲刺撞击
   */
  chargeAttack() {
    if (!this.player || !this.player.active) return;

    const angle = angleBetween(this.sprite.x, this.sprite.y, this.player.x, this.player.y);
    const chargeSpeed = 400;
    const chargeDuration = 800;

    // 警告线
    const warningLine = this.scene.add.graphics();
    warningLine.setDepth(12);
    warningLine.lineStyle(2, 0xff0000, 0.6);
    warningLine.beginPath();
    warningLine.moveTo(this.sprite.x, this.sprite.y);
    warningLine.lineTo(
      this.sprite.x + Math.cos(angle) * 300,
      this.sprite.y + Math.sin(angle) * 300
    );
    warningLine.strokePath();

    // 短暂延迟后冲刺
    this.scene.time.delayedCall(300, () => {
      warningLine.destroy();
      this.sprite.setVelocity(
        Math.cos(angle) * chargeSpeed,
        Math.sin(angle) * chargeSpeed
      );

      this.scene.time.delayedCall(chargeDuration, () => {
        this.sprite.setVelocity(0, 0);
      });
    });
  }

  /**
   * 导弹齐射
   */
  missileBarrage() {
    if (!this.player || !this.player.active) return;

    const missileCount = 6;
    for (let i = 0; i < missileCount; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        if (!this.sprite.active) return;
        const angle = angleBetween(this.sprite.x, this.sprite.y, this.player.x, this.player.y);
        const spread = (i - missileCount / 2) * 0.1;

        const bullet = Bullet.fire(
          this.scene,
          this.sprite.x + Math.cos(angle + spread) * 20,
          this.sprite.y + Math.sin(angle + spread) * 20,
          {
            bulletType: 'missile',
            bulletSpeed: 200,
            damage: 25,
            color: 0xff6600,
            tracking: true,
            trackingStrength: 0.02,
          },
          angle + spread,
          false
        );
        this.scene.enemyBullets.add(bullet);
      });
    }
  }

  /**
   * 追踪光球
   */
  orbitalLasers() {
    const orbCount = 4;
    const orbs = [];

    for (let i = 0; i < orbCount; i++) {
      const angle = (Math.PI * 2 * i) / orbCount;
      const orb = this.scene.add.circle(
        this.sprite.x + Math.cos(angle) * 80,
        this.sprite.y + Math.sin(angle) * 80,
        8,
        0xff00ff,
        0.8
      );
      orb.setDepth(12);
      orb.orbitAngle = angle;
      orb.orbitRadius = 80;
      orb.orbitSpeed = 0.02;
      orbs.push(orb);
    }

    // 光球旋转并追踪玩家
    const orbitTimer = this.scene.time.addEvent({
      delay: 30,
      repeat: 80, // 约2.4秒
      callback: () => {
        if (!this.sprite.active) return;

        for (const orb of orbs) {
          if (!orb.active) continue;
          orb.orbitAngle += orb.orbitSpeed;
          orb.x = this.sprite.x + Math.cos(orb.orbitAngle) * orb.orbitRadius;
          orb.y = this.sprite.y + Math.sin(orb.orbitAngle) * orb.orbitRadius;

          // 检查与玩家碰撞
          if (this.player && this.player.active) {
            const dist = distanceBetween(orb.x, orb.y, this.player.x, this.player.y);
            if (dist < 20) {
              this.player.takeDamage(10);
              orb.destroy();
            }
          }
        }
      },
    });

    // 清理
    this.scene.time.delayedCall(2500, () => {
      for (const orb of orbs) {
        if (orb.active) orb.destroy();
      }
    });
  }

  /**
   * 全屏弹幕
   */
  fullScreenBulletHell() {
    const waveCount = 3;
    const bulletsPerWave = 16;

    for (let wave = 0; wave < waveCount; wave++) {
      this.scene.time.delayedCall(wave * 400, () => {
        if (!this.sprite.active) return;

        for (let i = 0; i < bulletsPerWave; i++) {
          const angle = (Math.PI * 2 * i) / bulletsPerWave + wave * 0.5;
          const bullet = Bullet.fire(
            this.scene,
            this.sprite.x + Math.cos(angle) * 20,
            this.sprite.y + Math.sin(angle) * 20,
            { bulletType: 'plasma', bulletSpeed: 180, damage: 15, color: 0xff0044 },
            angle,
            false
          );
          this.scene.enemyBullets.add(bullet);
        }
      });
    }

    // 暴露期（Colossus P3：3秒内受伤2x）
    this.exposed = true;
    this.exposedTimer = 3000;
  }

  /**
   * 受到伤害
   * @param {number} amount - 伤害值
   */
  takeDamage(amount) {
    if (!this.sprite.active) return;

    // 暴露期伤害翻倍
    if (this.exposed) {
      amount *= 2;
    }

    this.health -= amount;

    // 受击闪烁
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite.active) {
        this.sprite.clearTint();
      }
    });

    // 血量≤0时死亡
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  /**
   * 死亡处理
   */
  die() {
    // 死亡爆炸粒子
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 40 + Math.random() * 40;
      const particle = this.scene.add.circle(
        this.sprite.x, this.sprite.y,
        4,
        CONFIG.COLORS.NEON_ORANGE,
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
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // 清理血条
    if (this.healthBar) {
      this.healthBar.destroy();
    }

    // 清理激光
    if (this.laserGraphics) {
      this.laserGraphics.destroy();
      this.laserGraphics = null;
    }

    // 屏幕震动
    this.scene.cameras.main.shake(300, 0.01);

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.BOSS_DEFEATED, this.name);

    this.sprite.destroy();
  }

  /**
   * 创建大型Boss血条
   * @returns {Phaser.GameObjects.Graphics}
   */
  createHealthBar() {
    const bar = this.scene.add.graphics();
    bar.setDepth(20);
    bar.setScrollFactor(0);
    this.updateHealthBar(bar);
    return bar;
  }

  /**
   * 更新Boss血条显示
   * @param {Phaser.GameObjects.Graphics} bar - 血条图形对象
   */
  updateHealthBar(bar) {
    bar = bar || this.healthBar;
    if (!bar) return;

    bar.clear();

    const barWidth = 300;
    const barHeight = 12;
    const x = (CONFIG.MAP_WIDTH - barWidth) / 2;
    const y = 15;

    // 背景
    bar.fillStyle(0x333333, 0.9);
    bar.fillRect(x, y, barWidth, barHeight);

    // 血量
    const healthPercent = this.health / this.maxHealth;
    const color = healthPercent > 0.5 ? 0xff4444 : (healthPercent > 0.25 ? 0xff8800 : 0xff0000);
    bar.fillStyle(color, 1);
    bar.fillRect(x, y, barWidth * healthPercent, barHeight);

    // 边框
    bar.lineStyle(2, 0xffffff, 0.6);
    bar.strokeRect(x, y, barWidth, barHeight);

    // Boss名称
    // 阶段指示
    const phaseName = this.phases[this.currentPhaseIndex]
      ? `P${this.currentPhaseIndex + 1}`
      : 'P1';
  }
}