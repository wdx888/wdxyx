/**
 * 自爆兵 - 高速冲向玩家，接近到40px自爆造成范围伤害
 */

import { Enemy } from '../Enemy.js';

export class Bomber extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'bomber');
  }
}