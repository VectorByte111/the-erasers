import Phaser from 'phaser';
import './style.css';
import { GAME_W, GAME_H, PHYSICS } from './config.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import FinalScene from './scenes/FinalScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#f4ecd8',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYSICS.gravity }, debug: false },
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, GameScene, FinalScene], // boots into the title screen
});
