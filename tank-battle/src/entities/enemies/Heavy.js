/**
 * 重装兵 - 慢速移动，3发散射弹扇形攻击
 */

import { Enemy } from '../Enemy.js';

export class Heavy extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'heavy');
  }
}