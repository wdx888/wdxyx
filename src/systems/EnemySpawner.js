/**
 * 敌人生成器
 * 负责创建敌人和Boss实例，管理敌人组
 */

import { eventBus } from '../utils/EventBus.js';
import { Scout } from '../entities/enemies/Scout.js';
import { Assault } from '../entities/enemies/Assault.js';
import { Heavy } from '../entities/enemies/Heavy.js';
import { Sniper } from '../entities/enemies/Sniper.js';
import { Miner } from '../entities/enemies/Miner.js';
import { Bomber } from '../entities/enemies/Bomber.js';
import { Scorpion } from '../entities/bosses/Scorpion.js';
import { Colossus } from '../entities/bosses/Colossus.js';

export class EnemySpawner {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
    this.enemyGroup = scene.physics.add.group({ runChildUpdate: true });
    this.bossGroup = scene.physics.add.group({ runChildUpdate: true });
  }

  /**
   * 根据类型生成敌人实例
   * @param {string} type - 敌人类型（scout/assault/heavy/sniper/miner/bomber）
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   * @returns {Enemy} 敌人实例
   */
  spawn(type, x, y) {
    let enemy;

    switch (type) {
      case 'scout':
        enemy = new Scout(this.scene, x, y);
        break;
      case 'assault':
        enemy = new Assault(this.scene, x, y);
        break;
      case 'heavy':
        enemy = new Heavy(this.scene, x, y);
        break;
      case 'sniper':
        enemy = new Sniper(this.scene, x, y);
        break;
      case 'miner':
        enemy = new Miner(this.scene, x, y);
        break;
      case 'bomber':
        enemy = new Bomber(this.scene, x, y);
        break;
      default:
        console.warn(`[EnemySpawner] 未知敌人类型: ${type}`);
        return null;
    }

    this.enemyGroup.add(enemy);
    eventBus.emit(eventBus.EVENTS.ENEMY_SPAWNED, enemy, type);
    return enemy;
  }

  /**
   * 生成Boss
   * @param {string} bossId - Boss标识（scorpion/colossus/scorpion_elite）
   * @param {number} x - 出生x坐标
   * @param {number} y - 出生y坐标
   * @returns {BossBase} Boss实例
   */
  spawnBoss(bossId, x, y) {
    let boss;

    switch (bossId) {
      case 'scorpion':
      case 'scorpion_elite':
        boss = new Scorpion(this.scene, x, y);
        break;
      case 'colossus':
        boss = new Colossus(this.scene, x, y);
        break;
      default:
        console.warn(`[EnemySpawner] 未知Boss ID: ${bossId}`);
        return null;
    }

    this.bossGroup.add(boss.sprite);
    eventBus.emit(eventBus.EVENTS.WAVE_BOSS, bossId);
    return boss;
  }

  /**
   * 获取所有存活敌人
   * @returns {Enemy[]}
   */
  getEnemyList() {
    return this.enemyGroup.getChildren().filter(e => e.active);
  }

  /**
   * 存活敌人数量
   * @returns {number}
   */
  getAliveEnemyCount() {
    return this.getEnemyList().length;
  }

  /**
   * 清理
   */
  destroy() {
    this.enemyGroup.clear(true, true);
    this.bossGroup.clear(true, true);
  }
}