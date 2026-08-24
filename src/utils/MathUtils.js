/**
 * 数学工具函数
 * 提供游戏中常用的数学计算
 */

/**
 * 计算两点间角度（弧度）
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} 弧度值
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 计算两点间距离
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distanceBetween(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 生成 [min, max] 范围内的随机整数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成 [min, max) 范围内的随机浮点数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 限制值在指定范围内
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 加权随机选择
 * @param {Array<{value: *, weight: number}>} items - 选项数组
 * @returns {*} 选中的value
 */
export function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }
  return items[items.length - 1].value;
}

/**
 * 归一化角度到 [0, 2PI) 范围
 * @param {number} angle - 弧度值
 * @returns {number}
 */
export function normalizeAngle(angle) {
  const twoPI = Math.PI * 2;
  angle = angle % twoPI;
  if (angle < 0) angle += twoPI;
  return angle;
}