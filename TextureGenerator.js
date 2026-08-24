/**
 * 纹理生成器
 * 在BootScene中调用，通过代码生成所有游戏纹理，零外部素材依赖
 * 使用 Phaser Graphics 绘制后 generateTexture() 并销毁
 */

import { CONFIG } from '../config.js';

export class TextureGenerator {
  /**
   * @param {Phaser.Scene} scene - Phaser场景引用
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 生成所有游戏纹理
   */
  generateAll() {
    this.generatePlayerTank();
    this.generateEnemyTank('scout');
    this.generateEnemyTank('assault');
    this.generateEnemyTank('heavy');
    this.generateEnemyTank('sniper');
    this.generateEnemyTank('miner');
    this.generateEnemyTank('bomber');
    this.generateBullets();
    this.generateWalls();
    this.generateBase();
    this.generateBossScorpion();
    this.generateBossColossus();
  }

  /**
   * 生成玩家坦克纹理 32x32
   * 蓝色主体，霓虹发光边框，深色履带纹理
   */
  generatePlayerTank() {
    const g = this.scene.add.graphics();
    const s = 32;
    const cx = s / 2;
    const cy = s / 2;

    // 履带 — 深色两侧
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(2, 4, 6, s - 8);
    g.fillRect(s - 8, 4, 6, s - 8);

    // 履带纹理条纹
    g.fillStyle(0x2a2a4e, 1);
    for (let i = 0; i < 5; i++) {
      const y = 6 + i * 4.5;
      g.fillRect(3, y, 4, 2);
      g.fillRect(s - 7, y, 4, 2);
    }

    // 车身主体
    g.fillStyle(0x0055aa, 1);
    g.fillRoundedRect(8, 6, 16, 20, 3);

    // 车身内部亮色
    g.fillStyle(0x0077cc, 1);
    g.fillRoundedRect(10, 8, 12, 16, 2);

    // 车身高光
    g.fillStyle(0x0099ee, 0.6);
    g.fillRect(12, 9, 4, 14);

    // 炮塔底座
    g.fillStyle(0x004488, 1);
    g.fillCircle(cx, cy, 7);

    // 炮管
    g.fillStyle(0x0088cc, 1);
    g.fillRect(cx - 1.5, cy - 14, 3, 14);

    // 炮管口
    g.fillStyle(0x00aaff, 1);
    g.fillRect(cx - 2, cy - 15, 4, 3);

    // 霓虹边框发光
    g.lineStyle(1, CONFIG.COLORS.NEON_BLUE, 0.8);
    g.strokeRoundedRect(8, 6, 16, 20, 3);
    g.strokeCircle(cx, cy, 7);
    g.strokeRect(cx - 1.5, cy - 14, 3, 14);

    g.generateTexture('player_tank', s, s);
    g.destroy();
  }

  /**
   * 生成敌人坦克纹理
   * @param {string} type - 敌人类型id
   */
  generateEnemyTank(type) {
    const g = this.scene.add.graphics();
    const sizeMap = { scout: 28, assault: 30, heavy: 34, sniper: 28, miner: 28, bomber: 28 };
    const s = sizeMap[type] || 28;
    const cx = s / 2;
    const cy = s / 2;

    // 履带
    g.fillStyle(0x1a0a0a, 1);
    g.fillRect(2, 3, 5, s - 6);
    g.fillRect(s - 7, 3, 5, s - 6);

    // 履带纹理
    g.fillStyle(0x331111, 1);
    for (let i = 0; i < 4; i++) {
      const y = 5 + i * ((s - 10) / 4);
      g.fillRect(3, y, 3, 1.5);
      g.fillRect(s - 6, y, 3, 1.5);
    }

    // 车身
    g.fillStyle(0xaa0033, 1);
    g.fillRoundedRect(7, 5, s - 14, s - 10, 3);

    g.fillStyle(0xcc1144, 1);
    g.fillRoundedRect(9, 7, s - 18, s - 14, 2);

    // 高光
    g.fillStyle(0xdd3355, 0.5);
    g.fillRect(10, 8, 3, s - 19);

    // 炮塔
    g.fillStyle(0x881122, 1);
    g.fillCircle(cx, cy, 6);

    // 炮管
    g.fillStyle(0xcc2244, 1);
    g.fillRect(cx - 1.5, cy - 12, 3, 12);

    // 霓虹红边框
    g.lineStyle(1, CONFIG.COLORS.NEON_RED, 0.7);
    g.strokeRoundedRect(7, 5, s - 14, s - 10, 3);
    g.strokeCircle(cx, cy, 6);

    g.generateTexture(`enemy_${type}`, s, s);
    g.destroy();
  }

  /**
   * 生成子弹纹理
   * plasma: 等离子蓝色圆球 6x6
   * laser: 激光红色细长矩形 4x12
   * rail: 电磁炮紫色长条 6x18
   * missile: 导弹橙色带尾焰 8x12
   */
  generateBullets() {
    // 等离子弹 — 蓝色圆球 6x6
    {
      const g = this.scene.add.graphics();
      g.fillStyle(0x00ddee, 1);
      g.fillCircle(3, 3, 3);
      g.fillStyle(0x00f0ff, 0.6);
      g.fillCircle(3, 3, 2);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(3, 2, 1);
      g.generateTexture('bullet_plasma', 6, 6);
      g.destroy();
    }

    // 激光束 — 红色细长矩形 4x12
    {
      const g = this.scene.add.graphics();
      g.fillStyle(0xff0022, 1);
      g.fillRect(0, 0, 4, 12);
      g.fillStyle(0xff4466, 0.8);
      g.fillRect(1, 0, 2, 12);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(1.5, 0, 1, 12);
      g.lineStyle(1, 0xff6688, 0.5);
      g.strokeRect(0, 0, 4, 12);
      g.generateTexture('bullet_laser', 4, 12);
      g.destroy();
    }

    // 电磁炮弹 — 紫色长条 6x18
    {
      const g = this.scene.add.graphics();
      g.fillStyle(0x8800dd, 1);
      g.fillRect(0, 0, 6, 18);
      g.fillStyle(0xaa00ff, 0.8);
      g.fillRect(1, 0, 4, 18);
      g.fillStyle(0xcc66ff, 0.6);
      g.fillRect(2, 0, 2, 18);
      // 发光边框
      g.lineStyle(1, 0xcc44ff, 0.8);
      g.strokeRect(0, 0, 6, 18);
      g.generateTexture('bullet_rail', 6, 18);
      g.destroy();
    }

    // 追踪导弹 — 橙色带尾焰 8x12
    {
      const g = this.scene.add.graphics();
      // 弹体
      g.fillStyle(0xff6600, 1);
      g.fillRoundedRect(0, 0, 8, 9, 2);
      g.fillStyle(0xff8833, 0.8);
      g.fillRoundedRect(1, 1, 6, 7, 1.5);
      // 弹头
      g.fillStyle(0xff4400, 1);
      g.fillTriangle(4, 0, 1, 3, 7, 3);
      // 尾焰
      g.fillStyle(0xffaa00, 0.8);
      g.fillRect(2, 9, 4, 3);
      g.fillStyle(0xffcc00, 0.6);
      g.fillRect(3, 9, 2, 3);
      g.generateTexture('bullet_missile', 8, 12);
      g.destroy();
    }
  }

  /**
   * 生成墙壁纹理
   * 砖墙 32x32（棕色，带砖缝）
   * 金属墙 32x32（灰色，带铆钉）
   */
  generateWalls() {
    const TILE = CONFIG.TILE_SIZE;

    // 砖墙 — 棕色 32x32
    {
      const g = this.scene.add.graphics();

      // 底色
      g.fillStyle(0x8b4513, 1);
      g.fillRect(0, 0, TILE, TILE);

      // 砖块
      g.fillStyle(0x9b5523, 1);
      // 第一行砖块
      g.fillRect(0, 0, 15, 7);
      g.fillRect(16, 0, 16, 7);
      // 第二行砖块（偏移半块）
      g.fillRect(0, 8, 7, 7);
      g.fillRect(8, 8, 15, 7);
      g.fillRect(24, 8, 8, 7);
      // 第三行
      g.fillRect(0, 16, 15, 7);
      g.fillRect(16, 16, 16, 7);
      // 第四行
      g.fillRect(0, 24, 7, 7);
      g.fillRect(8, 24, 15, 7);
      g.fillRect(24, 24, 8, 7);

      // 砖缝（深色线条）
      g.lineStyle(1, 0x5a3010, 0.8);
      g.strokeRect(0, 0, TILE, TILE);
      g.lineBetween(0, 8, TILE, 8);
      g.lineBetween(0, 16, TILE, 16);
      g.lineBetween(0, 24, TILE, 24);
      g.lineBetween(15, 0, 15, 8);
      g.lineBetween(16, 8, 16, 16);
      g.lineBetween(7, 8, 7, 16);
      g.lineBetween(7, 24, 7, 32);
      g.lineBetween(24, 16, 24, 24);
      g.lineBetween(15, 16, 15, 24);
      g.lineBetween(16, 24, 16, 32);

      g.generateTexture('wall_brick', TILE, TILE);
      g.destroy();
    }

    // 金属墙 — 灰色 32x32
    {
      const g = this.scene.add.graphics();

      // 底色
      g.fillStyle(0x555577, 1);
      g.fillRect(0, 0, TILE, TILE);

      // 金属板纹理
      g.fillStyle(0x666688, 1);
      g.fillRect(2, 2, 12, 12);
      g.fillRect(18, 2, 12, 12);
      g.fillRect(2, 18, 12, 12);
      g.fillRect(18, 18, 12, 12);

      // 金属板高光
      g.fillStyle(0x7777aa, 0.5);
      g.fillRect(3, 3, 5, 5);
      g.fillRect(19, 3, 5, 5);
      g.fillRect(3, 19, 5, 5);
      g.fillRect(19, 19, 5, 5);

      // 铆钉
      g.fillStyle(0x9999cc, 1);
      const rivetR = 1.5;
      g.fillCircle(8, 8, rivetR);
      g.fillCircle(24, 8, rivetR);
      g.fillCircle(16, 16, rivetR);
      g.fillCircle(8, 24, rivetR);
      g.fillCircle(24, 24, rivetR);

      // 边框
      g.lineStyle(1, 0x8888bb, 0.6);
      g.strokeRect(0, 0, TILE, TILE);
      g.lineBetween(16, 0, 16, TILE);
      g.lineBetween(0, 16, TILE, 16);

      g.generateTexture('wall_metal', TILE, TILE);
      g.destroy();
    }
  }

  /**
   * 生成能源塔（基地）纹理 48x48
   * 绿色发光核心，全息投影边框
   */
  generateBase() {
    const g = this.scene.add.graphics();
    const s = 48;
    const cx = s / 2;
    const cy = s / 2;

    // 底座
    g.fillStyle(0x1a3a1a, 1);
    g.fillRoundedRect(4, s - 12, s - 8, 10, 3);

    g.fillStyle(0x224422, 1);
    g.fillRoundedRect(6, s - 11, s - 12, 8, 2);

    // 塔身
    g.fillStyle(0x005533, 1);
    g.fillRect(cx - 8, 12, 16, s - 24);

    // 塔身渐变效果
    g.fillStyle(0x007744, 0.8);
    g.fillRect(cx - 6, 14, 12, s - 28);

    g.fillStyle(0x009955, 0.5);
    g.fillRect(cx - 3, 16, 6, s - 32);

    // 顶部穹顶
    g.fillStyle(0x006644, 1);
    g.fillCircle(cx, 10, 8);

    g.fillStyle(0x008855, 0.8);
    g.fillCircle(cx, 10, 6);

    // 发光核心
    g.fillStyle(0x00ff66, 0.9);
    g.fillCircle(cx, cy, 6);

    g.fillStyle(0x00ffaa, 0.6);
    g.fillCircle(cx, cy, 4);

    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx, cy - 1, 2);

    // 全息投影边框
    g.lineStyle(1, CONFIG.COLORS.NEON_GREEN, 0.7);
    g.strokeRoundedRect(4, s - 12, s - 8, 10, 3);
    g.strokeCircle(cx, 10, 8);

    // 外发光光环
    g.lineStyle(1, CONFIG.COLORS.BASE_GLOW, 0.3);
    g.strokeCircle(cx, cy, 10);

    g.generateTexture('base', s, s);
    g.destroy();
  }

  /**
   * 生成机械蝎Boss纹理 96x96
   */
  generateBossScorpion() {
    const g = this.scene.add.graphics();
    const s = 96;
    const cx = s / 2;
    const cy = s / 2;

    // 身体
    g.fillStyle(0x883300, 1);
    g.fillEllipse(cx, cy, 36, 50);

    g.fillStyle(0xaa4400, 1);
    g.fillEllipse(cx, cy, 28, 42);

    // 身体装甲板
    g.fillStyle(0xcc5500, 0.6);
    g.fillEllipse(cx, cy - 4, 18, 10);
    g.fillEllipse(cx, cy + 6, 20, 10);
    g.fillEllipse(cx, cy + 16, 14, 8);

    // 头部
    g.fillStyle(0x993300, 1);
    g.fillEllipse(cx, cy - 32, 16, 12);

    // 眼睛（红色发光）
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 4, cy - 34, 3);
    g.fillCircle(cx + 4, cy - 34, 3);
    g.fillStyle(0xff4444, 0.6);
    g.fillCircle(cx - 4, cy - 34, 1.5);
    g.fillCircle(cx + 4, cy - 34, 1.5);

    // 钳子
    g.fillStyle(0x994400, 1);
    g.fillRect(cx - 28, cy - 30, 12, 5);
    g.fillRect(cx + 16, cy - 30, 12, 5);
    g.fillStyle(0xbb5500, 1);
    g.fillRect(cx - 30, cy - 33, 6, 8);
    g.fillRect(cx + 24, cy - 33, 6, 8);

    // 六条腿
    g.fillStyle(0x773300, 1);
    for (let i = -1; i <= 1; i++) {
      // 左腿
      const ly = cy - 8 + i * 16;
      g.fillRect(cx - 28, ly, 14, 3);
      g.fillRect(cx - 30, ly + 2, 3, 6);
      // 右腿
      g.fillRect(cx + 14, ly, 14, 3);
      g.fillRect(cx + 27, ly + 2, 3, 6);
    }

    // 尾巴
    g.fillStyle(0x994400, 1);
    g.lineStyle(4, 0x994400, 1);
    g.beginPath();
    g.moveTo(cx, cy + 24);
    g.lineTo(cx + 10, cy + 30);
    g.lineTo(cx + 20, cy + 36);
    g.lineTo(cx + 16, cy + 42);
    g.strokePath();

    // 尾刺
    g.fillStyle(0xff2200, 1);
    g.fillTriangle(cx + 14, cy + 42, cx + 18, cy + 42, cx + 16, cy + 48);

    // 霓虹边框
    g.lineStyle(1, 0xff4400, 0.5);
    g.strokeEllipse(cx, cy, 36, 50);

    g.generateTexture('boss_scorpion', s, s);
    g.destroy();
  }

  /**
   * 生成战争巨像Boss纹理 128x128
   */
  generateBossColossus() {
    const g = this.scene.add.graphics();
    const s = 128;
    const cx = s / 2;
    const cy = s / 2;

    // 底部履带
    g.fillStyle(0x333344, 1);
    g.fillRect(cx - 40, s - 16, 80, 14);

    g.fillStyle(0x444455, 1);
    for (let i = 0; i < 8; i++) {
      g.fillRect(cx - 36 + i * 9, s - 14, 5, 10);
    }

    // 主体
    g.fillStyle(0x444466, 1);
    g.fillRoundedRect(cx - 30, 20, 60, s - 40, 8);

    g.fillStyle(0x555577, 1);
    g.fillRoundedRect(cx - 26, 24, 52, s - 48, 6);

    // 装甲板纹理
    g.fillStyle(0x666688, 0.5);
    g.fillRect(cx - 22, 30, 44, 20);
    g.fillRect(cx - 22, 55, 44, 20);
    g.fillRect(cx - 22, 80, 44, 20);

    // 炮塔底座
    g.fillStyle(0x555577, 1);
    g.fillCircle(cx, 22, 22);

    // 主炮管
    g.fillStyle(0x8888aa, 1);
    g.fillRect(cx - 4, 0, 8, 24);

    g.fillStyle(0xaaaacc, 1);
    g.fillRect(cx - 3, 1, 6, 20);

    // 炮口
    g.fillStyle(0xccccff, 1);
    g.fillRect(cx - 5, 0, 10, 4);

    // 副炮管（左右）
    g.fillStyle(0x777799, 1);
    g.fillRect(cx - 22, 8, 8, 4);
    g.fillRect(cx + 14, 8, 8, 4);

    // 核心反应堆（红色发光）
    g.fillStyle(0xff0000, 0.8);
    g.fillCircle(cx, cy + 10, 10);

    g.fillStyle(0xff4444, 0.6);
    g.fillCircle(cx, cy + 10, 6);

    g.fillStyle(0xff8888, 0.4);
    g.fillCircle(cx, cy + 10, 3);

    // 铆钉装饰
    g.fillStyle(0x9999bb, 1);
    const rivetPositions = [
      [cx - 20, 35], [cx + 20, 35],
      [cx - 20, 60], [cx + 20, 60],
      [cx - 20, 85], [cx + 20, 85],
      [cx - 14, 16], [cx + 14, 16],
    ];
    for (const [rx, ry] of rivetPositions) {
      g.fillCircle(rx, ry, 2);
    }

    // 霓虹边框
    g.lineStyle(1, 0xff4444, 0.5);
    g.strokeRoundedRect(cx - 30, 20, 60, s - 40, 8);
    g.strokeCircle(cx, 22, 22);

    g.generateTexture('boss_colossus', s, s);
    g.destroy();
  }
}