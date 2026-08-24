/**
 * 事件总线 - 单例模式
 * 用于解耦各模块间通信，提供发布/订阅功能
 */

class EventBus {
  constructor() {
    this._events = {};
  }

  /**
   * 注册事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 要移除的回调函数
   */
  off(event, callback) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  }

  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {...*} args - 传递给回调的参数
   */
  emit(event, ...args) {
    if (!this._events[event]) return;
    this._events[event].forEach(cb => {
      try {
        cb(...args);
      } catch (e) {
        console.error(`[EventBus] 事件 "${event}" 回调执行出错:`, e);
      }
    });
  }

  /**
   * 注册一次性事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * 清除所有事件监听
   */
  clear() {
    this._events = {};
  }
}

// 事件列表常量
EventBus.EVENTS = {
  WAVE_START: 'wave:start',
  WAVE_END: 'wave:end',
  WAVE_BOSS: 'wave:boss',
  ENEMY_KILLED: 'enemy:killed',
  ENEMY_SPAWNED: 'enemy:spawned',
  PLAYER_DAMAGE: 'player:damage',
  PLAYER_DEATH: 'player:death',
  PLAYER_UPGRADE: 'player:upgrade',
  BASE_DAMAGE: 'base:damage',
  BASE_DESTROYED: 'base:destroyed',
  UPGRADE_CHOOSE: 'upgrade:choose',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  BOSS_PHASE_CHANGE: 'boss:phaseChange',
  BOSS_DEFEATED: 'boss:defeated',
};

// 导出单例实例
export const eventBus = new EventBus();
export default eventBus;