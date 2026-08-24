/**
 * 武器数据配置
 * 定义游戏中所有可用武器及其属性
 */

export const WEAPONS = {
  plasma: {
    id: 'plasma',
    name: '等离子炮',
    damage: 15,
    fireRate: 400,
    bulletSpeed: 400,
    bulletType: 'plasma',
    color: 0x00f0ff,
    splash: true,
    splashRadius: 40,
    description: '蓝色等离子弹，小范围溅射',
  },

  laser: {
    id: 'laser',
    name: '激光束',
    damage: 5,
    fireRate: 80,
    bulletSpeed: 800,
    bulletType: 'laser',
    color: 0xff0044,
    pierce: true,
    description: '红色持续激光，穿透敌人',
  },

  railgun: {
    id: 'railgun',
    name: '电磁炮',
    damage: 60,
    fireRate: 1500,
    bulletSpeed: 900,
    bulletType: 'rail',
    color: 0xaa00ff,
    pierce: 3,
    chargeTime: 500,
    description: '紫色蓄力弹，穿透一排',
  },

  missile: {
    id: 'missile',
    name: '追踪导弹',
    damage: 30,
    fireRate: 800,
    bulletSpeed: 250,
    bulletType: 'missile',
    color: 0xff6600,
    tracking: true,
    trackingStrength: 0.03,
    description: '自动追踪最近敌人',
  },
};

/** 默认武器ID */
export const DEFAULT_WEAPON_ID = 'plasma';