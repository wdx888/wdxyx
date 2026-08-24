/**
 * 波次配置
 * 定义游戏所有波次的敌人组合
 * 索引0占位，实际波次从索引1开始
 */

export const WAVES = [
  // 索引0占位
  null,

  // 第1波 — 入门
  {
    enemies: [
      { type: 'scout', count: 3 },
    ],
    boss: null,
  },

  // 第2波
  {
    enemies: [
      { type: 'scout', count: 4 },
      { type: 'assault', count: 1 },
    ],
    boss: null,
  },

  // 第3波
  {
    enemies: [
      { type: 'assault', count: 3 },
      { type: 'scout', count: 2 },
    ],
    boss: null,
  },

  // 第4波
  {
    enemies: [
      { type: 'heavy', count: 3 },
      { type: 'scout', count: 2 },
    ],
    boss: null,
  },

  // 第5波 — Boss：机械蝎
  {
    enemies: [
      { type: 'scout', count: 2 },
      { type: 'assault', count: 2 },
    ],
    boss: 'scorpion',
  },

  // 第6波 — 难度提升
  {
    enemies: [
      { type: 'assault', count: 4 },
      { type: 'sniper', count: 2 },
      { type: 'scout', count: 2 },
    ],
    boss: null,
  },

  // 第7波
  {
    enemies: [
      { type: 'heavy', count: 3 },
      { type: 'sniper', count: 3 },
      { type: 'assault', count: 2 },
    ],
    boss: null,
  },

  // 第8波
  {
    enemies: [
      { type: 'miner', count: 3 },
      { type: 'heavy', count: 2 },
      { type: 'sniper', count: 2 },
      { type: 'scout', count: 3 },
    ],
    boss: null,
  },

  // 第9波
  {
    enemies: [
      { type: 'bomber', count: 4 },
      { type: 'assault', count: 3 },
      { type: 'miner', count: 2 },
      { type: 'heavy', count: 2 },
    ],
    boss: null,
  },

  // 第10波 — Boss：战争巨像
  {
    enemies: [
      { type: 'heavy', count: 2 },
      { type: 'sniper', count: 2 },
      { type: 'assault', count: 2 },
    ],
    boss: 'colossus',
  },

  // 第11波
  {
    enemies: [
      { type: 'bomber', count: 5 },
      { type: 'miner', count: 3 },
      { type: 'sniper', count: 3 },
      { type: 'assault', count: 3 },
    ],
    boss: null,
  },

  // 第12波
  {
    enemies: [
      { type: 'heavy', count: 4 },
      { type: 'bomber', count: 3 },
      { type: 'sniper', count: 3 },
      { type: 'miner', count: 2 },
    ],
    boss: null,
  },

  // 第13波
  {
    enemies: [
      { type: 'assault', count: 5 },
      { type: 'heavy', count: 4 },
      { type: 'bomber', count: 3 },
      { type: 'sniper', count: 3 },
      { type: 'miner', count: 2 },
    ],
    boss: null,
  },

  // 第14波
  {
    enemies: [
      { type: 'heavy', count: 5 },
      { type: 'bomber', count: 4 },
      { type: 'sniper', count: 4 },
      { type: 'assault', count: 3 },
      { type: 'miner', count: 3 },
    ],
    boss: null,
  },

  // 第15波 — Boss：精英机械蝎
  {
    enemies: [
      { type: 'heavy', count: 3 },
      { type: 'sniper', count: 3 },
      { type: 'bomber', count: 3 },
      { type: 'assault', count: 2 },
    ],
    boss: 'scorpion_elite',
  },
];