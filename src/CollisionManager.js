/**
 * 碰撞管理器
 * 设置所有物理碰撞对，处理子弹、敌人、Boss、墙壁、玩家之间的碰撞逻辑
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { distanceBetween } from '../utils/MathUtils.js';

export class CollisionManager {
  /**
   * @param {Phaser.Scene} scene - 场景引用
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 设置所有碰撞对
   */
  setup() {
    const { scene } = this;

    // 玩家子弹 vs 敌人组
    if (scene.playerBullets && scene.enemySpawner) {
      scene.physics.add.overlap(
        scene.playerBullets,
        scene.enemySpawner.enemyGroup,
        this.onBulletHitEnemy,
        null,
        this
      );
    }

    // 玩家子弹 vs Boss组
    if (scene.playerBullets && scene.enemySpawner) {
      scene.physics.add.overlap(
        scene.playerBullets,
        scene.enemySpawner.bossGroup,
        this.onBulletHitBoss,
        null,
        this
      );
    }

    // 敌人子弹 vs 玩家
    if (scene.enemyBullets && scene.player) {
      scene.physics.add.overlap(
        scene.enemyBullets,
        scene.player,
        this.onBulletHitPlayer,
        null,
        this
      );
    }

    // 敌人子弹 vs 基地
    if (scene.enemyBullets && scene.base) {
      scene.physics.add.overlap(
        scene.enemyBullets,
        scene.base,
        this.onBulletHitBase,
        null,
        this
      );
    }

    // 玩家 vs 敌人组
    if (scene.player && scene.enemySpawner) {
      scene.physics.add.overlap(
        scene.player,
        scene.enemySpawner.enemyGroup,
        this.onPlayerTouchEnemy,
        null,
        this
      );
    }

    // 玩家 vs Boss组
    if (scene.player && scene.enemySpawner) {
      scene.physics.add.overlap(
        scene.player,
        scene.enemySpawner.bossGroup,
        this.onPlayerTouchBoss,
        null,
        this
      );
    }

    // 所有子弹 vs 墙壁组
    if (scene.wallGroup) {
      if (scene.playerBullets) {
        scene.physics.add.collider(
          scene.playerBullets,
          scene.wallGroup,
          this.onBulletHitWall,
          null,
          this
        );
      }
      if (scene.enemyBullets) {
        scene.physics.add.collider(
          scene.enemyBullets,
          scene.wallGroup,
          this.onBulletHitWall,
          null,
          this
        );
      }
    }

    // 敌人 vs 墙壁组
    if (scene.enemySpawner && scene.wallGroup) {
      scene.physics.add.collider(
        scene.enemySpawner.enemyGroup,
        scene.wallGroup,
        null,
        null,
        this
      );
    }
  }

  /**
   * 子弹命中敌人
   * @param {Bullet} bullet - 子弹
   * @param {Phaser.Physics.Arcade.Sprite} enemySprite - 敌人精灵
   */
  onBulletHitEnemy(bullet, enemySprite) {
    if (!bullet.active || !enemySprite.active) return;
    if (!bullet.isPlayerBullet) return;

    // 获取敌人实例
    const enemy = enemySprite;
    if (enemy.takeDamage) {
      enemy.takeDamage(bullet.damage);
    }

    // 处理子弹命中
    bullet.onHit();
  }

  /**
   * 子弹命中Boss
   * @param {Bullet} bullet - 子弹
   * @param {Phaser.Physics.Arcade.Sprite} bossSprite - Boss精灵
   */
  onBulletHitBoss(bullet, bossSprite) {
    if (!bullet.active || !bossSprite.active) return;
    if (!bullet.isPlayerBullet) return;

    // 获取Boss实例
    const boss = bossSprite.owner;
    if (boss && boss.takeDamage) {
      boss.takeDamage(bullet.damage);
    }

    bullet.onHit();
  }

  /**
   * 子弹命中玩家
   * @param {Bullet} bullet - 子弹
   * @param {PlayerTank} player - 玩家
   */
  onBulletHitPlayer(bullet, player) {
    if (!bullet.active || !player.active) return;
    if (bullet.isPlayerBullet) return;

    player.takeDamage(bullet.damage);
    bullet.destroy();
  }

  /**
   * 子弹命中基地
   * @param {Bullet} bullet - 子弹
   * @param {object} base - 基地对象
   */
  onBulletHitBase(bullet, base) {
    if (!bullet.active || !base.active) return;
    if (bullet.isPlayerBullet) return;

    if (base.takeDamage) {
      base.takeDamage(bullet.damage);
    }
    bullet.destroy();
  }

  /**
   * 玩家碰到敌人
   * @param {PlayerTank} player - 玩家
   * @param {Phaser.Physics.Arcade.Sprite} enemySprite - 敌人精灵
   */
  onPlayerTouchEnemy(player, enemySprite) {
    if (!player.active || !enemySprite.active) return;
    if (player.invincible) return;

    // 玩家受伤
    player.takeDamage(1);

    // 敌人也受伤（碰撞伤害）
    if (enemySprite.takeDamage) {
      enemySprite.takeDamage(10);
    }
  }

  /**
   * 玩家碰到Boss
   * @param {PlayerTank} player - 玩家
   * @param {Phaser.Physics.Arcade.Sprite} bossSprite - Boss精灵
   */
  onPlayerTouchBoss(player, bossSprite) {
    if (!player.active || !bossSprite.active) return;
    if (player.invincible) return;

    player.takeDamage(2);

    // Boss碰撞伤害
    const boss = bossSprite.owner;
    if (boss && boss.takeDamage) {
      boss.takeDamage(5);
    }
  }

  /**
   * 子弹命中墙壁
   * @param {Bullet} bullet - 子弹
   * @param {Phaser.Physics.Arcade.Sprite} wall - 墙壁
   */
  onBulletHitWall(bullet, wall) {
    if (!bullet.active || !wall.active) return;

    // 砖墙：子弹和墙壁都销毁
    if (wall.wallType === 'brick') {
      wall.destroy();
      bullet.destroy();

      // 生成碎片粒子
      if (this.scene.particleManager) {
        this.scene.particleManager.createExplosion(
          wall.x, wall.y,
          CONFIG.COLORS.WALL_BRICK,
          0.6
        );
      }
    } else if (wall.wallType === 'metal') {
      // 金属墙：只销毁子弹
      bullet.destroy();

      // 火花粒子
      if (this.scene.particleManager) {
        this.scene.particleManager.createMuzzleFlash(
          bullet.x, bullet.y,
          Math.atan2(-bullet.body.velocity.y, -bullet.body.velocity.x),
          CONFIG.COLORS.WALL_METAL
        );
      }
    }
  }
}