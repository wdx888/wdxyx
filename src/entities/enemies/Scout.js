/**
 * 侦察兵 - 直接冲向玩家的快速敌人
 */

import { Enemy } from '../Enemy.js';

export class Scout extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'scout');
  }
}