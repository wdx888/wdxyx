/**
 * 敌人数据配置
 * 定义所有敌人类型及其属性
 */

export const ENEMIES = {
  scout: {
    id: 'scout',
    name: '侦察兵',
    health: 30,
    speed: 150,
    damage: 10,
    score: 100,
    color: 0xcc0033,
    size: 28,
    behavior: 'chase',
    fireRate: 2000,
  },

  assault: {
    id: 'assault',
    name: '突击兵',
    health: 50,
    speed: 100,
    damage: 12,
    score: 150,
    color: 0xdd1133,
    size: 30,
    behavior: 'shoot_and_move',
    fireRate: 1500,
  },

  heavy: {
    id: 'heavy',
    name: '重装兵',
    health: 120,
    speed: 50,
    damage: 20,
    score: 250,
    color: 0x990033,
    size: 34,
    behavior: 'scatter',
    fireRate: 2000,
    bulletCount: 3,
  },

  sniper: {
    id: 'sniper',
    name: '狙击兵',
    health: 40,
    speed: 60,
    damage: 35,
    score: 200,
    color: 0xee2244,
    size: 28,
    behavior: 'snipe',
    fireRate: 3000,
    bulletSpeed: 500,
  },

  miner: {
    id: 'miner',
    name: '布雷兵',
    health: 45,
    speed: 130,
    damage: 15,
    score: 180,
    color: 0xbb0044,
    size: 28,
    behavior: 'mine',
    fireRate: 4000,
    mineCount: 3,
  },

  bomber: {
    id: 'bomber',
    name: '自爆兵',
    health: 25,
    speed: 200,
    damage: 50,
    score: 120,
    color: 0xff5500,
    size: 28,
    behavior: 'explode',
    explodeRadius: 60,
  },
};