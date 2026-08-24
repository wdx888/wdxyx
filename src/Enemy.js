/**
 * 敌人基类
 * 继承Phaser.Physics.Arcade.Sprite，实现所有敌人AI行为
 * 包括：侦察兵冲撞、突击兵边射边移、重装兵散射、狙击兵狙杀、布雷兵布雷、自爆兵自爆
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { angleBetween, distanceBetween, clamp, randomBetween } from '../utils/MathUtils.js';
import { ENEMIES } from '../data/enemies.js';
import { Bullet } from './Bullet.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   * @param {string} enemyType - 敌人类型（scout/assault/heavy/sniper/miner/bomber）
   */
  constructor(scene, x, y, enemyType) {
    const textureKey = 'enemy_' + enemyType;
    super(scene, x, y, textureKey);

    // 加入场景并启用物理
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 从配置读取数据
    this.enemyType = enemyType;
    this.enemyData = ENEMIES[enemyType];

    // 基础属性
    this.health = this.enemyData.health;
    this.maxHealth = this.enemyData.health;
    this.speed = this.enemyData.speed;
    this.damage = this.enemyData.damage;
    this.score = this.enemyData.score;
    this.behavior = this.enemyData.behavior;
    this.fireRate = this.enemyData.fireRate;
    this.lastFireTime = 0;

    // 子弹属性
    this.bulletCount = this.enemyData.bulletCount || 1;
    this.bulletSpeed = this.enemyData.bulletSpeed || 300;

    // 特殊属性
    this.mineCount = this.enemyData.mineCount || 0;
    this.minesPlaced = 0;
    this.explodeRadius = this.enemyData.explodeRadius || 0;

    // 引用
    this.player = scene.player;
    this.base = scene.base;

    // 状态机
    this.state = 'patrol'; // patrol | chase | attack | flee | explode
    this.stateTimer = 0;

    // 智能AI参数
    this.patrolTarget = { x: x + randomBetween(-100, 100), y: y + randomBetween(-100, 100) };
    this.dodgeDirection = 0;
    this.dodgeTimer = 0;
    this.aggression = 0.5 + Math.random() * 0.5; // 攻击性随机
    this.reactionTime = 300 + Math.random() * 500; // 反应时间
    this.lastSeenPlayerPos = { x: x, y: y };
    this.stuckTimer = 0;
    this.lastPosition = { x: x, y: y };

    // 物理属性
    this.setSize(22, 22);
    this.setOffset((this.width - 22) / 2, (this.height - 22) / 2);
    this.setCollideWorldBounds(true);

    // 设置深度
    this.setDepth(9);

    // 创建头顶血条
    this.healthBar = this.createHealthBar();

    // 难度缩放：根据波次增强
    this.waveBonus = scene.waveManager ? scene.waveManager.currentWave * 0.05 : 0;
    this.speed *= (1 + this.waveBonus * 0.3);
    this.fireRate = Math.max(400, this.fireRate * (1 - this.waveBonus * 0.2));
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  update(time, delta) {
    if (!this.active) return;

    // 检查玩家是否存在
    if (!this.player || !this.player.active) {
      this.setVelocity(0, 0);
      return;
    }

    // 检测卡住
    const moved = distanceBetween(this.x, this.y, this.lastPosition.x, this.lastPosition.y);
    this.lastPosition.x = this.x;
    this.lastPosition.y = this.y;
    if (moved < 2) {
      this.stuckTimer += delta;
    } else {
      this.stuckTimer = 0;
    }
    if (this.stuckTimer > 2000) {
      this.stuckTimer = 0;
      this.patrolTarget = { x: randomBetween(64, CONFIG.MAP_WIDTH - 64), y: randomBetween(64, CONFIG.MAP_HEIGHT - 64) };
    }

    // 闪避计时器
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= delta;
    }

    // 执行AI行为
    this.executeBehavior(time, delta);

    // 更新血条位置
    this.updateHealthBar();

    // 朝向玩家
    const faceAngle = angleBetween(this.x, this.y, this.player.x, this.player.y);
    this.setRotation(faceAngle + Math.PI / 2);
  }

  /**
   * 行为分发
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  executeBehavior(time, delta) {
    switch (this.behavior) {
      case 'chase':
        this.chaseBehavior();
        break;
      case 'shoot_and_move':
        this.shootAndMove(time);
        break;
      case 'scatter':
        this.scatterBehavior(time);
        break;
      case 'snipe':
        this.snipeBehavior(time);
        break;
      case 'mine':
        this.mineBehavior(time);
        break;
      case 'explode':
        this.explodeBehavior();
        break;
    }
  }

  /**
   * 预测瞄准：根据目标移动速度预测射击位置
   * @param {Phaser.Physics.Arcade.Sprite} target - 目标
   * @returns {number|null} 预测角度（弧度）
   */
  predictTargetAngle(target) {
    if (!target || !target.body) return null;
    const dist = distanceBetween(this.x, this.y, target.x, target.y);
    if (dist < 50) return null; // 太近不预测
    const bulletTravelTime = dist / this.bulletSpeed;
    const predictedX = target.x + target.body.velocity.x * bulletTravelTime * 0.5;
    const predictedY = target.y + target.body.velocity.y * bulletTravelTime * 0.5;
    return angleBetween(this.x, this.y, predictedX, predictedY);
  }

  /**
   * 闪避玩家子弹：检测到玩家子弹接近时横向躲避
   * @returns {boolean} 是否正在闪避
   */
  checkDodge() {
    if (this.dodgeTimer > 0) return false;
    const playerBullets = this.scene.playerBullets;
    if (!playerBullets || !playerBullets.getChildren) return false;
    const children = playerBullets.getChildren();
    for (const bullet of children) {
      if (!bullet.active) continue;
      const dist = distanceBetween(this.x, this.y, bullet.x, bullet.y);
      if (dist < 80) {
        const bulletAngle = angleBetween(bullet.x, bullet.y, this.x, this.y);
        const dodgeAngle = bulletAngle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
        this.dodgeDirection = dodgeAngle;
        this.dodgeTimer = 400;
        return true;
      }
    }
    return false;
  }

  /**
   * 包抄：尝试绕到玩家侧面
   */
  flankPlayer() {
    if (!this.player || !this.player.active) return;
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);
    const flankAngle = angle + (Math.PI / 3) * (this.x > this.player.x ? 1 : -1);
    const targetDist = 200;
    const targetX = this.player.x + Math.cos(flankAngle) * targetDist;
    const targetY = this.player.y + Math.sin(flankAngle) * targetDist;
    const moveAngle = angleBetween(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(moveAngle) * this.speed * 0.8, Math.sin(moveAngle) * this.speed * 0.8);
  }

  /**
   * 侦察兵行为：蛇形迂回冲向玩家，近距离也射击
   */
  chaseBehavior(time) {
    if (!this.player || !this.player.active) return;
    if (this.checkDodge()) {
      this.setVelocity(Math.cos(this.dodgeDirection) * this.speed * 1.5, Math.sin(this.dodgeDirection) * this.speed * 1.5);
      return;
    }
    const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
    if (dist < 150 && Math.random() < 0.3) {
      this.flankPlayer();
      return;
    }
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);
    const wobble = Math.sin(time * 0.003 + this.x) * 0.4;
    const moveAngle = angle + wobble;
    this.setVelocity(Math.cos(moveAngle) * this.speed, Math.sin(moveAngle) * this.speed);
    if (dist < 200 && time - this.lastFireTime >= this.fireRate * 2) {
      this.shootAtPlayer(time);
    }
  }

  /**
   * 突击兵行为：保持距离，闪避，换向横移
   * @param {number} time - 当前时间
   */
  shootAndMove(time) {
    if (!this.player || !this.player.active) return;

    if (this.checkDodge()) {
      this.setVelocity(Math.cos(this.dodgeDirection) * this.speed * 1.3, Math.sin(this.dodgeDirection) * this.speed * 1.3);
      if (time - this.lastFireTime >= this.fireRate * 1.5) this.shootAtPlayer(time);
      return;
    }

    const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);

    if (dist > 300) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < 180) {
      this.setVelocity(Math.cos(angle) * -this.speed * 0.8, Math.sin(angle) * -this.speed * 0.8);
    } else {
      const strafeAngle = angle + Math.PI / 2 * (Math.sin(time * 0.002) > 0 ? 1 : -1);
      this.setVelocity(Math.cos(strafeAngle) * this.speed * 0.6, Math.sin(strafeAngle) * this.speed * 0.6);
    }

    this.shootAtPlayer(time);
  }

  /**
   * 重装兵行为：闪避，散射弹带预测瞄准
   * @param {number} time - 当前时间
   */
  scatterBehavior(time) {
    if (!this.player || !this.player.active) return;

    if (this.checkDodge()) {
      this.setVelocity(Math.cos(this.dodgeDirection) * this.speed * 1.2, Math.sin(this.dodgeDirection) * this.speed * 1.2);
      return;
    }

    const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);

    if (dist > 280) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < 200) {
      this.setVelocity(Math.cos(angle) * -this.speed * 0.6, Math.sin(angle) * -this.speed * 0.6);
    } else {
      this.setVelocity(0, 0);
    }

    if (time - this.lastFireTime >= this.fireRate) {
      this.lastFireTime = time;
      const predictedAngle = this.predictTargetAngle(this.player) || angle;
      const spreadAngle = 0.25;
      const startAngle = predictedAngle - (spreadAngle * (this.bulletCount - 1)) / 2;

      for (let i = 0; i < this.bulletCount; i++) {
        const bulletAngle = startAngle + spreadAngle * i;
        const bullet = Bullet.fire(
          this.scene,
          this.x + Math.cos(bulletAngle) * 14,
          this.y + Math.sin(bulletAngle) * 14,
          { bulletType: 'plasma', bulletSpeed: this.bulletSpeed, damage: this.damage, color: CONFIG.COLORS.NEON_RED },
          bulletAngle,
          false
        );
        this.scene.enemyBullets.add(bullet);
      }
    }
  }

  /**
   * 狙击兵行为：远距离站位，预测瞄准精准射击
   * @param {number} time - 当前时间
   */
  snipeBehavior(time) {
    if (!this.player || !this.player.active) return;

    const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);

    if (dist < 250) {
      this.setVelocity(Math.cos(angle) * -this.speed * 0.9, Math.sin(angle) * -this.speed * 0.9);
    } else if (dist > 500) {
      this.setVelocity(Math.cos(angle) * this.speed * 0.7, Math.sin(angle) * this.speed * 0.7);
    } else {
      this.setVelocity(0, 0);
    }

    if (time - this.lastFireTime >= this.fireRate) {
      this.lastFireTime = time;
      const predictedAngle = this.predictTargetAngle(this.player) || angle;
      const bullet = Bullet.fire(
        this.scene,
        this.x + Math.cos(predictedAngle) * 14,
        this.y + Math.sin(predictedAngle) * 14,
        { bulletType: 'laser', bulletSpeed: this.bulletSpeed, damage: this.damage, color: CONFIG.COLORS.NEON_RED },
        predictedAngle,
        false
      );
      this.scene.enemyBullets.add(bullet);
    }
  }

  /**
   * 布雷兵行为：曲线移动，更难预测
   * @param {number} time - 当前时间
   */
  mineBehavior(time) {
    if (!this.player || !this.player.active) return;

    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);
    const wobble = Math.sin(time * 0.004 + this.x * 0.01) * 0.5;
    this.setVelocity(
      Math.cos(angle + wobble) * this.speed,
      Math.sin(angle + wobble) * this.speed
    );

    if (time - this.lastFireTime >= this.fireRate && this.minesPlaced < this.mineCount) {
      this.lastFireTime = time;
      this.placeMine();
      this.minesPlaced++;
    }
  }

  /**
   * 自爆兵行为：闪避，预判拦截自爆
   */
  explodeBehavior(time) {
    if (!this.player || !this.player.active) return;

    if (this.checkDodge()) {
      this.setVelocity(Math.cos(this.dodgeDirection) * this.speed * 1.5, Math.sin(this.dodgeDirection) * this.speed * 1.5);
      return;
    }

    const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
    const angle = angleBetween(this.x, this.y, this.player.x, this.player.y);
    const predictedAngle = this.predictTargetAngle(this.player) || angle;

    this.setVelocity(
      Math.cos(predictedAngle) * this.speed,
      Math.sin(predictedAngle) * this.speed
    );

    if (dist <= 50) {
      this.explode();
    }
  }

  /**
   * 向玩家射击（带预测瞄准）
   * @param {number} time - 当前时间
   */
  shootAtPlayer(time) {
    if (time - this.lastFireTime < this.fireRate) return;
    if (!this.player || !this.player.active) return;

    this.lastFireTime = time;
    const predictedAngle = this.predictTargetAngle(this.player);
    const angle = predictedAngle || angleBetween(this.x, this.y, this.player.x, this.player.y);

    const bullet = Bullet.fire(
      this.scene,
      this.x + Math.cos(angle) * 14,
      this.y + Math.sin(angle) * 14,
      { bulletType: 'plasma', bulletSpeed: this.bulletSpeed, damage: this.damage, color: CONFIG.COLORS.NEON_RED },
      angle,
      false
    );
    this.scene.enemyBullets.add(bullet);
  }

  /**
   * 向目标坐标射击
   * @param {number} time - 当前时间
   * @param {number} targetX - 目标x
   * @param {number} targetY - 目标y
   */
  shoot(time, targetX, targetY) {
    if (time - this.lastFireTime < this.fireRate) return;

    this.lastFireTime = time;
    const angle = angleBetween(this.x, this.y, targetX, targetY);

    const bullet = Bullet.fire(
      this.scene,
      this.x + Math.cos(angle) * 14,
      this.y + Math.sin(angle) * 14,
      { bulletType: 'plasma', bulletSpeed: this.bulletSpeed, damage: this.damage, color: CONFIG.COLORS.NEON_RED },
      angle,
      false
    );
    this.scene.enemyBullets.add(bullet);
  }

  /**
   * 放置地雷
   */
  placeMine() {
    // 在当前敌人位置放置地雷
    const mine = this.scene.add.circle(this.x, this.y, 8, 0xff0000, 0.8);
    mine.setDepth(8);
    mine.mineData = {
      damage: 30,
      radius: 50,
      armed: false,
      armTime: this.scene.time.now + 1000, // 1秒后启动
    };

    // 闪烁提示
    this.scene.tweens.add({
      targets: mine,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        mine.mineData.armed = true;
        mine.setFillStyle(0xff0000, 1);
      },
    });

    // 加入地雷列表
    if (!this.scene.mines) {
      this.scene.mines = this.scene.physics.add.staticGroup();
    }
    // 将地雷存储以便后续碰撞检测
    if (!this.scene.mineList) {
      this.scene.mineList = [];
    }
    this.scene.mineList.push(mine);
  }

  /**
   * 自爆
   */
  explode() {
    // 爆炸粒子
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = this.explodeRadius * (0.5 + Math.random() * 0.5);
      const particle = this.scene.add.circle(
        this.x, this.y,
        3,
        CONFIG.COLORS.NEON_ORANGE,
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
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // 爆炸范围伤害
    if (this.player && this.player.active) {
      const dist = distanceBetween(this.x, this.y, this.player.x, this.player.y);
      if (dist <= this.explodeRadius) {
        const falloff = 1 - dist / this.explodeRadius;
        const explosionDamage = Math.floor(this.damage * falloff);
        if (this.player.takeDamage) {
          this.player.takeDamage(explosionDamage);
        }
      }
    }

    this.die();
  }

  /**
   * 受到伤害
   * @param {number} amount - 伤害值
   */
  takeDamage(amount) {
    if (!this.active) return;

    this.health -= amount;

    // 受击闪烁
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
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
    // 死亡粒子
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 20 + Math.random() * 15;
      const particle = this.scene.add.circle(
        this.x, this.y,
        2,
        CONFIG.COLORS.NEON_RED,
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
        duration: 300,
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

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.ENEMY_KILLED, this, this.score);

    this.destroy();
  }

  /**
   * 创建头顶血条
   * @returns {Phaser.GameObjects.Graphics}
   */
  createHealthBar() {
    const bar = this.scene.add.graphics();
    bar.setDepth(12);
    this.updateHealthBar(bar);
    return bar;
  }

  /**
   * 更新血条显示
   * @param {Phaser.GameObjects.Graphics} bar - 血条图形对象（可选覆盖）
   */
  updateHealthBar(bar) {
    bar = bar || this.healthBar;
    if (!bar || !this.active) return;

    bar.clear();

    const barWidth = 24;
    const barHeight = 3;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height / 2 - 8;

    // 背景
    bar.fillStyle(0x333333, 0.8);
    bar.fillRect(x, y, barWidth, barHeight);

    // 血量
    const healthPercent = this.health / this.maxHealth;
    const color = healthPercent > 0.5 ? 0x00ff00 : (healthPercent > 0.25 ? 0xffff00 : 0xff0000);
    bar.fillStyle(color, 1);
    bar.fillRect(x, y, barWidth * healthPercent, barHeight);
  }
}