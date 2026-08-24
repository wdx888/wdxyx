/**
 * 强化管理器
 * 负责强化选项的随机选取、应用强化效果到玩家、追踪已获得强化
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { UPGRADES } from '../data/upgrades.js';
import { weightedRandom } from '../utils/MathUtils.js';

/** 稀有度权重映射 */
const RARITY_WEIGHTS = {
  common: 60,
  rare: 30,
  epic: 10,
};

export class UpgradeManager {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
    this.playerUpgrades = [];
  }

  /**
   * 随机选择指定数量的强化选项
   * @param {number} count - 选项数量（默认3）
   * @returns {Array<object>} 强化对象数组
   */
  getRandomUpgrades(count = CONFIG.UPGRADE_OPTIONS_COUNT) {
    const available = UPGRADES.filter(upgrade => {
      // 已获得且不可堆叠的排除
      if (this.hasUpgrade(upgrade.id)) {
        const obtained = this.playerUpgrades.filter(u => u.id === upgrade.id).length;
        if (obtained >= (upgrade.maxStack || 1)) {
          return false;
        }
      }
      return true;
    });

    if (available.length === 0) {
      // 全部强化已满，随机返回任意
      const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    // 先按稀有度加权随机，再随机选取
    const selected = [];
    const pool = [...available];

    for (let i = 0; i < count && pool.length > 0; i++) {
      // 构建加权选项
      const weightedItems = pool.map(u => ({
        value: u,
        weight: RARITY_WEIGHTS[u.rarity] || 10,
      }));

      const chosen = weightedRandom(weightedItems);
      selected.push(chosen);

      // 从候选池中移除已选中的
      const idx = pool.indexOf(chosen);
      if (idx >= 0) pool.splice(idx, 1);
    }

    return selected;
  }

  /**
   * 应用强化效果到玩家
   * @param {object} upgrade - 强化数据对象
   * @param {PlayerTank} player - 玩家坦克实例
   */
  applyUpgrade(upgrade, player) {
    if (!upgrade || !player) return;

    switch (upgrade.type) {
      case 'attack':
        this.applyAttackUpgrade(upgrade, player);
        break;
      case 'defense':
        this.applyDefenseUpgrade(upgrade, player);
        break;
      case 'speed':
        this.applySpeedUpgrade(upgrade, player);
        break;
      case 'weapon':
        this.applyWeaponUpgrade(upgrade, player);
        break;
      case 'special':
        this.applySpecialUpgrade(upgrade, player);
        break;
    }

    // 记录已获得
    this.playerUpgrades.push({ id: upgrade.id, rarity: upgrade.rarity });

    // 通知事件总线
    eventBus.emit(eventBus.EVENTS.PLAYER_UPGRADE, upgrade);
  }

  /**
   * 应用攻击类强化
   * @param {object} upgrade - 强化数据
   * @param {PlayerTank} player - 玩家
   */
  applyAttackUpgrade(upgrade, player) {
    switch (upgrade.id) {
      case 'damage_boost':
        // 伤害倍率
        if (!player.buffs['damage_boost']) player.buffs['damage_boost'] = 0;
        player.buffs['damage_boost'] += upgrade.value;
        break;
      case 'fire_rate_boost':
        // 射速倍率
        if (!player.buffs['fire_rate_boost']) player.buffs['fire_rate_boost'] = 0;
        player.buffs['fire_rate_boost'] += upgrade.value;
        break;
      case 'bullet_plus':
        if (!player.buffs['bullet_plus']) player.buffs['bullet_plus'] = 0;
        player.buffs['bullet_plus'] += upgrade.value;
        break;
      case 'crit_chance':
        if (!player.buffs['crit_chance']) player.buffs['crit_chance'] = 0;
        player.buffs['crit_chance'] += upgrade.value;
        break;
      case 'crit_damage':
        if (!player.buffs['crit_damage']) player.buffs['crit_damage'] = 0;
        player.buffs['crit_damage'] += upgrade.value;
        break;
      case 'pierce_plus':
        if (!player.buffs['pierce_plus']) player.buffs['pierce_plus'] = 0;
        player.buffs['pierce_plus'] += upgrade.value;
        break;
    }
  }

  /**
   * 应用防御类强化
   * @param {object} upgrade - 强化数据
   * @param {PlayerTank} player - 玩家
   */
  applyDefenseUpgrade(upgrade, player) {
    switch (upgrade.id) {
      case 'max_health':
        player.maxHealth += upgrade.value;
        player.health = Math.min(player.health + upgrade.value, player.maxHealth);
        break;
      case 'shield':
        if (!player.buffs['shield']) player.buffs['shield'] = 0;
        player.buffs['shield'] += upgrade.value;
        break;
      case 'invincible_time':
        player.invincibleDuration += upgrade.value;
        break;
      case 'heal_on_kill':
        if (!player.buffs['heal_on_kill']) player.buffs['heal_on_kill'] = 0;
        player.buffs['heal_on_kill'] += upgrade.value;
        break;
    }
  }

  /**
   * 应用移速类强化
   * @param {object} upgrade - 强化数据
   * @param {PlayerTank} player - 玩家
   */
  applySpeedUpgrade(upgrade, player) {
    switch (upgrade.id) {
      case 'speed_boost':
        if (!player.buffs['speed_boost']) player.buffs['speed_boost'] = 0;
        player.buffs['speed_boost'] += upgrade.value;
        break;
      case 'dash':
        player.buffs['dash'] = true;
        player.buffs['dash_cooldown'] = upgrade.value;
        break;
      case 'turn_speed':
        if (!player.buffs['turn_speed']) player.buffs['turn_speed'] = 0;
        player.buffs['turn_speed'] += upgrade.value;
        break;
    }
  }

  /**
   * 应用武器类强化
   * @param {object} upgrade - 强化数据
   * @param {PlayerTank} player - 玩家
   */
  applyWeaponUpgrade(upgrade, player) {
    switch (upgrade.id) {
      case 'weapon_laser':
      case 'weapon_railgun':
      case 'weapon_missile':
        player.addWeapon(upgrade.value);
        break;
      case 'weapon_slot':
        player.maxWeapons += upgrade.value;
        break;
    }
  }

  /**
   * 应用特殊类强化
   * @param {object} upgrade - 强化数据
   * @param {PlayerTank} player - 玩家
   */
  applySpecialUpgrade(upgrade, player) {
    switch (upgrade.id) {
      case 'drone':
        if (!player.buffs['drone']) player.buffs['drone'] = 0;
        player.buffs['drone'] += upgrade.value;
        break;
      case 'mine_drop':
        if (!player.buffs['mine_drop']) player.buffs['mine_drop'] = 0;
        player.buffs['mine_drop'] += upgrade.value;
        break;
      case 'time_slow':
        player.buffs['time_slow'] = true;
        player.buffs['time_slow_factor'] = upgrade.value;
        break;
    }
  }

  /**
   * 是否已拥有该强化
   * @param {string} id - 强化ID
   * @returns {boolean}
   */
  hasUpgrade(id) {
    return this.playerUpgrades.some(u => u.id === id);
  }

  /**
   * 已获得强化数量
   * @returns {number}
   */
  getUpgradeCount() {
    return this.playerUpgrades.length;
  }
}