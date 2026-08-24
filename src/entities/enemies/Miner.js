/**
 * 布雷兵 - 快速移动，路过时放置地雷
 */

import { Enemy } from '../Enemy.js';

export class Miner extends Enemy {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'miner');
  }
}