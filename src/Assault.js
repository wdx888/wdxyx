/**
 * 突击兵 - 保持200-300px距离，边走边射击
 */

import { Enemy } from '../Enemy.js';

export class Assault extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'assault');
  }
}