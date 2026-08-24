/**
 * 核心战斗场景
 * 管理地图、玩家、敌人、波次、碰撞、UI等所有游戏逻辑
 */

import { CONFIG } from '../config.js';
import { eventBus } from '../utils/EventBus.js';
import { generateMap } from '../data/maps.js';
import { PlayerTank } from '../entities/PlayerTank.js';
import { WaveManager } from '../systems/WaveManager.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { UpgradeManager } from '../systems/UpgradeManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { ParticleManager } from '../systems/ParticleManager.js';
import { HUD } from '../ui/HUD.js';
import { BossHealthBar } from '../ui/BossHealthBar.js';

/** Boss ID到名称/最大生命的映射 */
const BOSS_INFO = {
    scorpion: { name: '机械蝎', maxHealth: 300 },
    scorpion_elite: { name: '机械蝎·精英', maxHealth: 300 },
    colossus: { name: '战争巨像', maxHealth: 600 },
};

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // 0. 重置状态
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        // 1. 创建地图
        this.createMap();

        // 2. 创建物理组
        this.playerBullets = this.physics.add.group({
            runChildUpdate: true,
            maxSize: 50,
        });
        this.enemyBullets = this.physics.add.group({
            runChildUpdate: true,
            maxSize: 100,
        });

        // 3. 创建玩家（PlayerTank构造器内部已add.existing和physics.add.existing）
        const spawnX = 15 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const spawnY = 16 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.player = new PlayerTank(this, spawnX, spawnY);
        this.player.setCollideWorldBounds(true);

        // 4. 创建基地
        this.createBase();

        // 5. 初始化系统
        this.enemySpawner = new EnemySpawner(this);
        // 暴露敌人组引用，供Bullet追踪/溅射逻辑使用
        this.enemies = this.enemySpawner.enemyGroup;
        this.waveManager = new WaveManager(this);
        this.upgradeManager = new UpgradeManager(this);
        this.collisionManager = new CollisionManager(this);
        this.particleManager = new ParticleManager(this);
        this.collisionManager.setup();

        // 补充碰撞：玩家与墙壁
        this.physics.add.collider(this.player, this.wallGroup);
        // 补充碰撞：Boss组与墙壁
        if (this.enemySpawner && this.enemySpawner.bossGroup) {
            this.physics.add.collider(this.enemySpawner.bossGroup, this.wallGroup);
        }

        // 6. 创建UI
        this.hud = new HUD(this);
        this.hud.create();
        this.bossHealthBar = null;

        // 7. 设置输入
        this.setupInput();

        // 8. 监听事件
        this.setupEvents();

        // 9. 开始第一波
        this.time.delayedCall(1000, () => {
            this.waveManager.startWave(1);
        });

        // 启动测试弹：1.5秒后朝上方自动发射一颗子弹，验证子弹系统
        this.time.delayedCall(1500, () => {
            if (this.player && this.player.active) {
                this.player.aimAngle = -Math.PI / 2;
                this.player.shoot(this.time.now, 0);
            }
        });

        // 10. 入场淡入
        this.cameras.main.fadeIn(500);
    }

    /**
     * 创建地图：生成墙壁碰撞体并绘制地面网格
     */
    createMap() {
        this.mapData = generateMap();
        this.wallGroup = this.physics.add.staticGroup();

        for (let row = 0; row < CONFIG.ROWS; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                const tile = this.mapData[row][col];
                const x = col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const y = row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

                if (tile === 1) {
                    // 砖墙：一枪可破
                    const wall = this.wallGroup.create(x, y, 'wall_brick');
                    wall.setImmovable(true);
                    wall.wallType = 'brick';
                    wall.health = 1;
                } else if (tile === 2) {
                    // 金属墙：不可破坏
                    const wall = this.wallGroup.create(x, y, 'wall_metal');
                    wall.setImmovable(true);
                    wall.wallType = 'metal';
                    wall.health = Infinity;
                }
            }
        }

        // 绘制地面网格
        this.drawGroundGrid();
    }

    /**
     * 绘制地面网格线（半透明，置于底层）
     */
    drawGroundGrid() {
        const g = this.add.graphics();
        g.lineStyle(1, CONFIG.COLORS.GRID, 0.3);
        for (let x = 0; x <= CONFIG.MAP_WIDTH; x += CONFIG.TILE_SIZE) {
            g.lineBetween(x, 0, x, CONFIG.MAP_HEIGHT);
        }
        for (let y = 0; y <= CONFIG.MAP_HEIGHT; y += CONFIG.TILE_SIZE) {
            g.lineBetween(0, y, CONFIG.MAP_WIDTH, y);
        }
        g.setDepth(-1);
    }

    /**
     * 创建基地（能源塔），带旋转光环动画
     */
    createBase() {
        this.base = this.physics.add.sprite(
            CONFIG.BASE_X,
            CONFIG.BASE_Y,
            'base'
        );
        this.base.setImmovable(true);
        this.base.health = CONFIG.BASE_HEALTH;
        this.base.maxHealth = CONFIG.BASE_HEALTH;

        // 基地受伤处理
        this.base.takeDamage = (amount) => {
            this.base.health -= amount;
            this.base.health = Math.max(0, this.base.health);
            eventBus.emit(eventBus.EVENTS.BASE_DAMAGE, this.base.health);
            if (this.base.health <= 0) {
                eventBus.emit(eventBus.EVENTS.BASE_DESTROYED);
            }
        };

        // 基地全息旋转光环
        this.tweens.add({
            targets: this.base,
            angle: 360,
            duration: 4000,
            repeat: -1,
        });
    }

    /**
     * 供Boss spawnMinions调用的快捷敌人生成方法
     * @param {string} type - 敌人类型
     * @param {number} x - 坐标
     * @param {number} y - 坐标
     */
    spawnEnemy(type, x, y) {
        if (this.enemySpawner) {
            this.enemySpawner.spawn(type, x, y);
        }
    }

    /**
     * 设置键盘与鼠标输入
     */
    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
        };
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.key1 = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.ONE
        );
        this.key2 = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.TWO
        );
        this.keyQ = this.input.keyboard.addKey('Q');
        this.keyE = this.input.keyboard.addKey('E');
        this.escKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC
        );

        // 鼠标射击
        this.isShooting = false;
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isShooting = true;
            }
        });
        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) {
                this.isShooting = false;
            }
        });
    }

    /**
     * 注册所有事件总线监听
     */
    setupEvents() {
        // 敌人击杀
        eventBus.on(eventBus.EVENTS.ENEMY_KILLED, (enemy, score) => {
            this.score += enemy.score || 0;
            this.hud.updateScore(this.score);
            this.waveManager.onEnemyKilled();
        });

        // 波次开始
        eventBus.on(eventBus.EVENTS.WAVE_START, (wave) => {
            this.hud.updateWave(wave);
            this.hud.showWaveAnnouncement(wave);
        });

        // 玩家受伤
        eventBus.on(eventBus.EVENTS.PLAYER_DAMAGE, (health) => {
            this.hud.updateHealth(health, this.player.maxHealth);
        });

        // 玩家死亡
        eventBus.on(eventBus.EVENTS.PLAYER_DEATH, () => {
            this.handleGameOver();
        });

        // 基地受伤
        eventBus.on(eventBus.EVENTS.BASE_DAMAGE, (health) => {
            this.hud.updateBaseHealth(health, CONFIG.BASE_HEALTH);
            this.particleManager.createBaseDamageEffect(this.base);
        });

        // 基地摧毁
        eventBus.on(eventBus.EVENTS.BASE_DESTROYED, () => {
            this.handleGameOver();
        });

        // Boss阶段切换
        eventBus.on(eventBus.EVENTS.BOSS_PHASE_CHANGE, (bossName, phaseIndex) => {
            if (this.bossHealthBar) {
                this.bossHealthBar.updatePhase(phaseIndex);
            }
        });

        // Boss击败
        eventBus.on(eventBus.EVENTS.BOSS_DEFEATED, () => {
            if (this.bossHealthBar) {
                this.bossHealthBar.hide();
                this.bossHealthBar = null;
            }
            this.score += 500;
            this.hud.updateScore(this.score);
        });

        // Boss波次：创建Boss血条
        eventBus.on(eventBus.EVENTS.WAVE_BOSS, (bossId) => {
            const info = BOSS_INFO[bossId];
            if (info && !this.bossHealthBar) {
                this.bossHealthBar = new BossHealthBar(
                    this,
                    info.name,
                    info.maxHealth
                );
                this.bossHealthBar.show();
                this.hud.showBossWarning(info.name);
            }
        });

        // 强化选择：数字→打开面板，对象→已被UpgradeScene应用
        eventBus.on(eventBus.EVENTS.UPGRADE_CHOOSE, (data) => {
            if (typeof data === 'number') {
                // 波次管理器通知，打开强化选择场景
                this.scene.launch('UpgradeScene');
            }
            // 对象类型由UpgradeScene内部处理，此处不再重复应用
        });

        // 玩家获得强化效果
        eventBus.on(eventBus.EVENTS.PLAYER_UPGRADE, (upgrade) => {
            this.particleManager.createUpgradeEffect(
                this.player.x,
                this.player.y
            );
        });
    }

    /**
     * 游戏结束处理
     */
    handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;

        // 清理波次管理器
        this.waveManager.destroy();

        // 屏幕震动与红色闪烁
        this.cameras.main.shake(500, 0.02);
        this.cameras.main.flash(500, 255, 0, 0);

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', {
                score: this.score,
                wave: this.waveManager.currentWave,
            });
        });
    }

    /**
     * 每帧更新
     */
    update(time, delta) {
        if (this.gameOver || this.isPaused) return;

        // 玩家移动
        this.player.handleMovement(this.cursors, this.wasd);

        // 玩家瞄准
        const pointer = this.input.activePointer;
        this.player.handleAim(pointer);

        // 玩家射击（鼠标按住或空格键，轮询方式更可靠）
        if (this.isShooting || this.spaceKey.isDown || this.input.activePointer.isDown) {
            this.player.shoot(time, delta);
        }

        // 武器切换
        if (
            Phaser.Input.Keyboard.JustDown(this.key1) ||
            Phaser.Input.Keyboard.JustDown(this.keyQ)
        ) {
            this.player.switchWeapon(0);
        }
        if (
            Phaser.Input.Keyboard.JustDown(this.key2) ||
            Phaser.Input.Keyboard.JustDown(this.keyE)
        ) {
            this.player.switchWeapon(1);
        }

        // 暂停
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }

        // 更新波次管理器
        this.waveManager.update(time, delta);

        // 更新Boss（攻击模式、阶段切换、移动）
        if (this.waveManager.currentBoss) {
            this.waveManager.currentBoss.update(time, delta);
        }

        // 更新Boss血条
        if (this.bossHealthBar && this.waveManager.currentBoss) {
            const boss = this.waveManager.currentBoss;
            this.bossHealthBar.updateHealth(boss.health, boss.maxHealth);
            this.bossHealthBar.update();
        }

        // 更新玩家
        this.player.update(time, delta);

        // 更新HUD武器栏
        this.hud.updateWeapons(
            this.player.weapons,
            this.player.activeWeaponIndex
        );
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            this.showPauseOverlay();
        } else {
            this.physics.resume();
            this.hidePauseOverlay();
        }
    }

    /**
     * 显示暂停覆盖层
     */
    showPauseOverlay() {
        this.pauseOverlay = this.add
            .rectangle(
                CONFIG.MAP_WIDTH / 2,
                CONFIG.MAP_HEIGHT / 2,
                CONFIG.MAP_WIDTH,
                CONFIG.MAP_HEIGHT,
                0x000000,
                0.7
            )
            .setDepth(100)
            .setScrollFactor(0);

        this.pauseText = this.add
            .text(
                CONFIG.MAP_WIDTH / 2,
                CONFIG.MAP_HEIGHT / 2,
                '暂停\n\n按 ESC 继续',
                {
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '36px',
                    color: '#00f0ff',
                    align: 'center',
                }
            )
            .setOrigin(0.5)
            .setDepth(101)
            .setScrollFactor(0);
    }

    /**
     * 隐藏暂停覆盖层
     */
    hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
        if (this.pauseText) {
            this.pauseText.destroy();
            this.pauseText = null;
        }
    }
}