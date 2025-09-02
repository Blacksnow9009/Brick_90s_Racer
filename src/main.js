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
  scale: {
    mode: Phaser.Scale.FIT,           // Scale to fit screen while preserving aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center canvas horizontally and vertically
  },
};


new Phaser.Game(config);
