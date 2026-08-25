/**
 * 地图数据配置
 * 生成游戏地图的二维数组
 * 0=空地, 1=砖墙, 2=金属墙
 */

import { CONFIG } from '../config.js';

const { ROWS, COLS } = CONFIG;

/**
 * 生成地图数据
 * @returns {number[][]} 二维数组 map[ROWS][COLS]
 */
export function generateMap() {
  // 初始化全0地图
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  // 外围一圈金属墙
  for (let col = 0; col < COLS; col++) {
    map[0][col] = 2;
    map[ROWS - 1][col] = 2;
  }
  for (let row = 0; row < ROWS; row++) {
    map[row][0] = 2;
    map[row][COLS - 1] = 2;
  }

  // 内部随机分布砖墙，约占25%
  const totalCells = ROWS * COLS;
  const targetBrickCount = Math.floor(totalCells * 0.25);

  // 保护区域：底部中央玩家基地周围
  const protectedRows = [17, 18, 19];
  const protectedCols = [13, 14, 15, 16, 17];

  // 敌人生成区域：上方和左右
  const spawnRowsTop = [1, 2];
  const spawnColsSide = [1, 2, 27, 28];

  let brickPlaced = 0;
  const maxAttempts = targetBrickCount * 10;
  let attempts = 0;

  while (brickPlaced < targetBrickCount && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * (ROWS - 2)) + 1;
    const col = Math.floor(Math.random() * (COLS - 2)) + 1;

    // 跳过保护区域
    if (protectedRows.includes(row) && protectedCols.includes(col)) continue;
    // 跳过敌人生成区域
    if (spawnRowsTop.includes(row) && col >= 2 && col <= COLS - 3) continue;
    if (spawnColsSide.includes(col) && row >= 2 && row <= ROWS - 3) continue;

    // 跳过已是砖墙或金属墙的位置
    if (map[row][col] !== 0) continue;

    map[row][col] = 1;
    brickPlaced++;
  }

  // 底部中央保护圈：基地位置(对应CONFIG.BASE_X/32≈15, BASE_Y/32≈18.5)
  // 基地行 = 18，基地列 = 15
  const baseRow = 18;
  const baseCol = 15;
  const protectionPattern = [
    // 上方保护
    [baseRow - 1, baseCol - 1],
    [baseRow - 1, baseCol],
    [baseRow - 1, baseCol + 1],
    // 左右保护
    [baseRow, baseCol - 1],
    [baseRow, baseCol + 1],
    // 下方保护
    [baseRow + 1, baseCol - 1],
    [baseRow + 1, baseCol],
    [baseRow + 1, baseCol + 1],
  ];

  for (const [r, c] of protectionPattern) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      // 清除该位置原有砖墙，设为砖墙保护
      map[r][c] = 1;
    }
  }

  // 确保基地位置和玩家出生点是空地
  map[baseRow][baseCol] = 0;

  // 玩家出生点 (baseCol, baseRow-2) 即 (15, 16) 及其周围确保空地
  const playerRow = 16;
  const playerCol = 15;
  const playerClear = [
    [playerRow, playerCol],
    [playerRow - 1, playerCol],
    [playerRow, playerCol - 1],
    [playerRow, playerCol + 1],
    [playerRow + 1, playerCol],
  ];

  for (const [r, c] of playerClear) {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      map[r][c] = 0;
    }
  }

  return map;
}