import './style.css';
import Phaser from 'phaser';
import { GameScene } from './GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  backgroundColor: '#181820',
  parent: 'app',
  scene: [GameScene],
};

new Phaser.Game(config);
