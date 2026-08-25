/**
 * 机械蝎Boss（第5波）
 * 缓慢横向移动，保持与玩家150-300px距离
 * P1: 激光扫射(旋转180°)，3连发散射弹
 * P2: 360°弹幕(8发)，召唤2只自爆兵，冲刺撞击
 */

import { BossBase } from './BossBase.js';
import { angleBetween, distanceBetween } from '../../utils/MathUtils.js';

export class Scorpion extends BossBase {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, {
      texture: 'boss_scorpion',
      maxHealth: 300,
      speed: 40,
      name: '机械蝎',
      phases: [
        {
          threshold: 0.5,
          attacks: ['laserSweep', 'scatterShot'],
        },
        {
          threshold: 0,
          attacks: ['bulletCircle', 'chargeAttack', 'spawnMinions'],
        },
      ],
    });

    // 重写 bulletCircle 为8发
    this._bulletCircleCount = 8;

    // 移动方向
    this.moveDir = 1; // 1向右，-1向左
  }

  /**
   * 移动逻辑：横向移动，保持与玩家150-300px距离
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  updateMovement(time, delta) {
    if (!this.player || !this.player.active) return;

    const dist = distanceBetween(this.sprite.x, this.sprite.y, this.player.x, this.player.y);

    // 横向移动
    this.sprite.x += this.moveDir * this.speed * delta / 1000;

    // 边界反弹
    if (this.sprite.x < 80) {
      this.moveDir = 1;
    } else if (this.sprite.x > 880) {
      this.moveDir = -1;
    }

    // 垂直方向调整距离
    if (dist < 150) {
      this.sprite.y += this.speed * 0.5 * delta / 1000;
    } else if (dist > 300) {
      this.sprite.y -= this.speed * 0.5 * delta / 1000;
    }
  }

  /**
   * 执行攻击模式（覆盖以使用8发弹幕）
   * @param {string} attack - 攻击名称
   */
  executeAttack(attack) {
    if (attack === 'bulletCircle') {
      this.bulletCircle(this._bulletCircleCount);
    } else if (attack === 'spawnMinions') {
      this.spawnMinions('bomber', 2);
    } else {
      super.executeAttack(attack);
    }
  }
}