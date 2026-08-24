/**
 * 狙击兵 - 远距离站位，精准高伤害单发
 */

import { Enemy } from '../Enemy.js';

export class Sniper extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'sniper');
  }
}