/**
 * 波次管理器
 * 控制游戏波次流程：构建生成队列、逐波推进、Boss波触发、波次间间歇
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { WAVES } from '../data/waves.js';

/** 出生点配置：上方3个 + 左右各1个 */
const SPAWN_POINTS = [
  { x: 160, y: 32 },
  { x: 480, y: 32 },
  { x: 800, y: 32 },
  { x: 32, y: 320 },
  { x: 928, y: 320 },
];

export class WaveManager {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 0;
    this.enemiesRemaining = 0;
    this.spawnQueue = [];
    this.waveActive = false;
    this.spawnTimer = null;
    this.waveInterval = CONFIG.WAVE_INTERVAL;
    this.bossWave = false;
    this.currentBoss = null;
  }

  /**
   * 开始第n波
   * @param {number} n - 波次数
   */
  startWave(n) {
    // 检查是否有波次配置
    if (n >= WAVES.length || !WAVES[n]) {
      // 所有波次完成，无限循环模式：随机生成敌人
      this.startInfiniteWave();
      return;
    }

    this.currentWave = n;
    this.waveActive = true;
    this.bossWave = false;
    this.currentBoss = null;

    const waveConfig = WAVES[n];

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.WAVE_START, n);

    // 如果是Boss波
    if (waveConfig.boss) {
      this.bossWave = true;
      eventBus.emit(eventBus.EVENTS.WAVE_BOSS, waveConfig.boss);

      // 先生成普通敌人
      this.buildSpawnQueue(waveConfig);
      this.enemiesRemaining = this.spawnQueue.length;

      // 延迟生成Boss（在普通敌人之后）
      this.scene.time.delayedCall(2000, () => {
        this.spawnBoss(waveConfig.boss);
      });
    } else {
      // 非Boss波：构建生成队列
      this.buildSpawnQueue(waveConfig);
      this.enemiesRemaining = this.spawnQueue.length;
    }

    // 启动定时生成
    this.startSpawning();
  }

  /**
   * 无限循环模式：随机组合敌人
   */
  startInfiniteWave() {
    this.currentWave++;
    this.waveActive = true;
    this.bossWave = false;

    // 随机组合敌人
    const enemyTypes = ['scout', 'assault', 'heavy', 'sniper', 'miner', 'bomber'];
    const count = 3 + Math.floor(Math.random() * 5);

    const enemiesConfig = [];
    for (let i = 0; i < count; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      enemiesConfig.push({ type, count: 1 });
    }

    const waveConfig = { enemies: enemiesConfig, boss: null };
    this.buildSpawnQueue(waveConfig);
    this.enemiesRemaining = this.spawnQueue.length;

    eventBus.emit(eventBus.EVENTS.WAVE_START, this.currentWave);
    this.startSpawning();
  }

  /**
   * 根据波次配置构建生成队列
   * @param {object} waveConfig - 波次配置 { enemies: [{type, count}] }
   */
  buildSpawnQueue(waveConfig) {
    this.spawnQueue = [];

    for (const entry of waveConfig.enemies) {
      for (let i = 0; i < entry.count; i++) {
        this.spawnQueue.push(entry.type);
      }
    }

    // 随机打乱生成顺序
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
  }

  /**
   * 启动定时生成
   */
  startSpawning() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    this.spawnTimer = this.scene.time.addEvent({
      delay: CONFIG.ENEMY_SPAWN_INTERVAL,
      callback: () => {
        if (this.spawnQueue.length > 0) {
          const type = this.spawnQueue.shift();
          this.spawnEnemy(type);
        } else {
          // 队列为空，停止定时器
          if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
          }
        }
      },
      loop: true,
    });
  }

  /**
   * 根据类型在随机出生点生成敌人
   * @param {string} type - 敌人类型
   */
  spawnEnemy(type) {
    const pos = this.getSpawnPosition();
    if (this.scene.enemySpawner) {
      this.scene.enemySpawner.spawn(type, pos.x, pos.y);
    }
  }

  /**
   * 生成Boss
   * @param {string} bossId - Boss标识
   */
  spawnBoss(bossId) {
    const pos = { x: CONFIG.MAP_WIDTH / 2, y: 80 };
    if (this.scene.enemySpawner) {
      const boss = this.scene.enemySpawner.spawnBoss(bossId, pos.x, pos.y);
      this.currentBoss = boss;
    }
  }

  /**
   * 随机获取一个出生点
   * @returns {{x: number, y: number}}
   */
  getSpawnPosition() {
    const idx = Math.floor(Math.random() * SPAWN_POINTS.length);
    const point = SPAWN_POINTS[idx];
    // 添加小幅随机偏移
    return {
      x: point.x + (Math.random() - 0.5) * 40,
      y: point.y + (Math.random() - 0.5) * 20,
    };
  }

  /**
   * 敌人死亡回调
   */
  onEnemyKilled() {
    this.enemiesRemaining--;
    if (this.enemiesRemaining <= 0 && this.spawnQueue.length === 0) {
      this.endWave();
    }
  }

  /**
   * 波次结束
   */
  endWave() {
    this.waveActive = false;
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    eventBus.emit(eventBus.EVENTS.WAVE_END, this.currentWave);

    const isBossWave = this.bossWave;
    const isUpgradeWave = (this.currentWave % CONFIG.UPGRADE_WAVE_INTERVAL === 0) && !isBossWave;

    if (isUpgradeWave) {
      // 强化选择波次，通知场景打开强化面板
      eventBus.emit(eventBus.EVENTS.UPGRADE_CHOOSE, this.currentWave);
    }

    // 延迟后开始下一波
    this.scene.time.delayedCall(this.waveInterval, () => {
      this.startWave(this.currentWave + 1);
    });
  }

  /**
   * 每帧更新
   * @param {number} time - 当前时间
   * @param {number} delta - 帧间隔
   */
  update(time, delta) {
    // 预留：波次中特殊逻辑
  }

  /**
   * 清理
   */
  destroy() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
    this.spawnQueue = [];
    this.waveActive = false;
    this.currentBoss = null;
  }
}