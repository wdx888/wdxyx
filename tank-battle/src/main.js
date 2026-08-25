// Phaser 通过 CDN script 标签全局加载，无需 import
import { CONFIG } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UpgradeScene } from './scenes/UpgradeScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.MAP_WIDTH,
  height: CONFIG.MAP_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, UpgradeScene, GameOverScene],
};

const game = new Phaser.Game(phaserConfig);
