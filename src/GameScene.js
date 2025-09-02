import Phaser from 'phaser';

// ProgressManager: handles score, mileage, unlocks, localStorage
class ProgressManager {
  constructor(scene) {
    this.scene = scene;
    this.highScore = Number(localStorage.getItem('highScore')) || 0;
    this.totalMileage = Number(localStorage.getItem('totalMileage')) || 0;
  }
  addMileage(miles) {
    this.totalMileage += miles;
    localStorage.setItem('totalMileage', this.totalMileage);
  }
  updateHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('highScore', score);
    }
  }
}

class PlayerCar {
  constructor(scene) {
    this.scene = scene;
    this.width = 40;
    this.height = 60;
    this.laneCount = 2;
    this.currentLane = 0;
    this.y = 700;
    // Stylized top-down car using Phaser graphics
    this.carGraphics = scene.add.graphics();
    this.skidMarks = [];
    this.tiltAngle = 0;
    this.updatePosition();
    this.drawCar();
  }
  drawCar() {
    this.carGraphics.clear();
    // Car body
    this.carGraphics.fillStyle(0x3185FC, 1);
    this.carGraphics.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    // Roof
    this.carGraphics.fillStyle(0xF9F9F9, 0.7);
    this.carGraphics.fillRect(-this.width/4, -this.height/2 + 8, this.width/2, 16);
    // Hood
    this.carGraphics.fillStyle(0x222222, 0.5);
    this.carGraphics.fillRect(-this.width/2, -this.height/2, this.width, 10);
    // Trunk
    this.carGraphics.fillStyle(0x222222, 0.5);
    this.carGraphics.fillRect(-this.width/2, this.height/2 - 10, this.width, 10);
    // Wheels
    this.carGraphics.fillStyle(0x222222, 1);
    this.carGraphics.fillRect(-this.width/2, -this.height/2 + 6, 8, this.height - 12);
    this.carGraphics.fillRect(this.width/2 - 8, -this.height/2 + 6, 8, this.height - 12);
    // Headlights
    this.carGraphics.fillStyle(0xFFFFAA, 0.8);
    this.carGraphics.fillRect(-this.width/4, -this.height/2, 8, 4);
    this.carGraphics.fillRect(this.width/4 - 8, -this.height/2, 8, 4);
    // Exhaust smoke (if speed is high)
    if (this.scene.currentSpeed > this.scene.baseSpeed * 2) {
      this.scene.add.circle(this.x, this.y + this.height/2 + 8, 6, 0xCCCCCC, 0.4);
    }
    // Skid marks (if moving left/right at high speed)
    if (this.scene.currentSpeed > this.scene.baseSpeed * 2 && this.tiltAngle !== 0) {
      let mark = this.scene.add.rectangle(this.x, this.y + this.height/2 - 4, 24, 2, 0x222222, 0.5);
      this.skidMarks.push(mark);
      if (this.skidMarks.length > 10) {
        let old = this.skidMarks.shift();
        old.destroy();
      }
    }
    // Apply tilt
    this.carGraphics.rotation = Phaser.Math.DegToRad(this.tiltAngle);
  }
  updatePosition() {
    const laneWidth = 200 / 2;
    const laneCenter = 140 + (this.currentLane + 0.5) * laneWidth;
    this.x = laneCenter;
    this.carGraphics.x = this.x;
    this.carGraphics.y = this.y;
    this.drawCar();
  }
  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.tiltAngle = -15;
      this.updatePosition();
    }
  }
  moveRight() {
    if (this.currentLane < this.laneCount - 1) {
      this.currentLane++;
      this.tiltAngle = 15;
      this.updatePosition();
    }
  }
  reset() {
    this.currentLane = 0;
    this.tiltAngle = 0;
    this.updatePosition();
  }
  getBounds() {
    // Return a Phaser.Geom.Rectangle for collision
    return new Phaser.Geom.Rectangle(
      this.x - this.width/2,
      this.y - this.height/2,
      this.width,
      this.height
    );
  }
}

class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.baseSpawnInterval = 3000;
    this.laneCount = 2;
  }
  spawnObstacle() {
    const laneWidth = 200 / 2;
    const laneCenter = 140 + (Phaser.Math.Between(0, this.laneCount - 1) + 0.5) * laneWidth;
    const width = 40, height = 60;
    const x = laneCenter;
    const y = -height;
    // Stylized top-down car obstacle with random color
    const colors = [0xE84855, 0x3185FC, 0xF9DC5C, 0x34A853, 0xA259F7, 0xFF9800];
    const carColor = Phaser.Utils.Array.GetRandom(colors);
    const graphics = this.scene.add.graphics({ x, y });
    // Car body
    graphics.fillStyle(carColor, 1);
    graphics.fillRect(-width/2, -height/2, width, height);
    // Roof
    graphics.fillStyle(0xF9F9F9, 0.7);
    graphics.fillRect(-width/4, -height/2 + 8, width/2, 16);
    // Hood
    graphics.fillStyle(0x222222, 0.5);
    graphics.fillRect(-width/2, -height/2, width, 10);
    // Trunk
    graphics.fillStyle(0x222222, 0.5);
    graphics.fillRect(-width/2, height/2 - 10, width, 10);
    // Wheels
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(-width/2, -height/2 + 6, 8, height - 12);
    graphics.fillRect(width/2 - 8, -height/2 + 6, 8, height - 12);
    // Headlights
    graphics.fillStyle(0xFFFFAA, 0.8);
    graphics.fillRect(-width/4, -height/2, 8, 4);
    graphics.fillRect(width/4 - 8, -height/2, 8, 4);
    this.obstacles.push({rect: graphics, x, y, width, height});
  }
  update(time, speed) {
    this.obstacles.forEach(obs => {
      obs.y += speed * 0.016;
      obs.rect.y = obs.y;
      obs.rect.x = obs.x;
    });
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.y > 800) {
        obs.rect.destroy();
        return false;
      }
      return true;
    });
    if (time - this.lastSpawnTime > this.baseSpawnInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = time;
    }
  }
  checkCollision(player) {
    const p = player.getBounds();
    return this.obstacles.some(obs => {
      // Use manual rectangle for obstacle bounds
      const o = new Phaser.Geom.Rectangle(
        obs.x - obs.width/2,
        obs.y - obs.height/2,
        obs.width,
        obs.height
      );
      if (obs.y > 600) {
        return Phaser.Geom.Intersects.RectangleToRectangle(p, o);
      }
      return false;
    });
  }
  reset() {
    this.obstacles.forEach(obs => {
      obs.rect.destroy();
    });
    this.obstacles = [];
  }
}

function getLeaderboard() {
  const board = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  return Array.isArray(board) ? board : [];
}
function saveLeaderboard(board) {
  localStorage.setItem('leaderboard', JSON.stringify(board));
}

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Road gradient for depth (Phaser-compatible)
    this.roadGradient = this.add.graphics({ x: 140, y: 0 });
    for (let i = 0; i < 8; i++) {
      let color = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(34,34,42),
        new Phaser.Display.Color(68,68,74),
        8,
        i
      );
      let hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      this.roadGradient.fillStyle(hex, 1);
      this.roadGradient.fillRect(0, i * 100, 200, 100);
    }
    // Lane divider (dashed)
    this.laneLines = [];
    for (let y = 40; y < 800; y += 40) {
      this.laneLines.push(this.add.rectangle(240, y, 8, 24, 0xF9F9F9, 0.7));
    }
    // Guardrails/barriers
    this.leftRail = this.add.rectangle(140, 400, 8, 800, 0xCCCCCC, 0.5);
    this.rightRail = this.add.rectangle(340, 400, 8, 800, 0xCCCCCC, 0.5);
    // Semi-transparent HUD panel
    this.hudPanel = this.add.rectangle(240, 30, 220, 54, 0x222222, 0.35).setDepth(200);
    // Add bushes well outside the road (left: 60, right: 420)
    this.bushes = [];
    for (let i = 0; i < 10; i++) {
      let y = i * 80 + 40;
      this.bushes.push(this.add.ellipse(60, y, 30, 18, 0x228B22).setDepth(0));
      this.bushes.push(this.add.ellipse(420, y, 30, 18, 0x228B22).setDepth(0));
    }
    // Score and speed
    this.score = 0;
    this.lastScoreTime = 0;
    this.progressManager = new ProgressManager(this);
    this.playerCar = new PlayerCar(this);
    this.obstacleManager = new ObstacleManager(this);
    this.hud = this.add.text(240, 30, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#F9F9F9',
      align: 'center',
      fixedWidth: 220,
      wordWrap: { width: 220 },
      shadow: { offsetX: 2, offsetY: 2, color: '#222', blur: 2, fill: true }
    }).setOrigin(0.5, 0.5).setDepth(201);
    // Game Over screen elements
    this.gameOverPanel = this.add.rectangle(240, 400, 320, 220, 0x222222, 0.85).setDepth(300).setVisible(false);
    this.gameOverText = this.add.text(240, 340, 'GAME OVER', { fontFamily: 'monospace', fontSize: '40px', color: '#E84855' }).setOrigin(0.5).setDepth(301).setVisible(false);
    this.statsText = this.add.text(240, 400, '', { fontFamily: 'monospace', fontSize: '20px', color: '#F9F9F9' }).setOrigin(0.5).setDepth(301).setVisible(false);
    this.restartButton = this.add.text(240, 470, 'Restart', { fontFamily: 'monospace', fontSize: '24px', color: '#3185FC', backgroundColor: '#181820' }).setOrigin(0.5).setDepth(301).setVisible(false).setInteractive();
    this.restartButton.on('pointerdown', () => {
      if (this.gameState === 'gameOver') this.restart();
    });
    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.gameState === 'playing') this.playerCar.moveLeft();
    });
    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.gameState === 'playing') this.playerCar.moveRight();
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameState === 'gameOver') this.restart();
    });
    // Speed system
    this.baseSpeed = 200;
    this.currentSpeed = this.baseSpeed;
    this.speedIncreaseInterval = 5000; // 5 seconds
    this.speedIncreaseFactorEarly = 1.3; // 30% for first 60s
    this.speedIncreaseFactorLate = 1.15; // 15% after 60s
    this.earlySpeedTime = 60000; // 60 seconds
    this.maxSpeedTime = 120000; // 120 seconds
    this.startTime = 0;
    this.gameState = 'playing';
    this.leaderboard = getLeaderboard();
    this.nameInput = null;
  }

  update(time, delta) {
    if (this.gameState !== 'playing') return;
    // Speed logic
    if (this.startTime === 0) this.startTime = time;
    const elapsed = time - this.startTime;
    let earlyLevels = Math.min(Math.floor(elapsed / this.speedIncreaseInterval), Math.floor(this.earlySpeedTime / this.speedIncreaseInterval));
    let lateLevels = 0;
    if (elapsed > this.earlySpeedTime) {
      lateLevels = Math.min(Math.floor((elapsed - this.earlySpeedTime) / this.speedIncreaseInterval), Math.floor((this.maxSpeedTime - this.earlySpeedTime) / this.speedIncreaseInterval));
    }
    this.currentSpeed = this.baseSpeed * Math.pow(this.speedIncreaseFactorEarly, earlyLevels) * Math.pow(this.speedIncreaseFactorLate, lateLevels);
    // Animate lane lines
    this.laneLines.forEach(line => {
      line.y += this.currentSpeed * 0.016;
      if (line.y > 800) line.y -= 800;
    });
    // Animate bushes
    this.bushes.forEach(bush => {
      bush.y += this.currentSpeed * 0.016;
      if (bush.y > 820) bush.y -= 800;
    });
    // Score
    if (time - this.lastScoreTime > 100) {
      this.score += 1;
      this.progressManager.addMileage(1);
      this.lastScoreTime = time;
    }
    // Update entities
    this.playerCar.updatePosition();
    // Pass current speed to obstacle manager
    this.obstacleManager.update(time, this.currentSpeed);
    // Collision
    if (this.obstacleManager.checkCollision(this.playerCar)) {
      this.gameOver();
    }
    // HUD
    this.hud.setText(`Score: ${this.score}\nHi-Score: ${this.progressManager.highScore}\nMileage: ${this.progressManager.totalMileage}\nSpeed: ${Math.round(this.currentSpeed)} px/s`);
    // Animate car tilt back to center
    if (this.playerCar.tiltAngle !== 0) {
      this.playerCar.tiltAngle += this.playerCar.tiltAngle > 0 ? -1 : 1;
      if (Math.abs(this.playerCar.tiltAngle) < 1) this.playerCar.tiltAngle = 0;
      this.playerCar.drawCar();
    }
  }

  gameOver() {
    this.gameState = 'gameOver';
    this.progressManager.updateHighScore(this.score);
    this.currentSpeed = this.baseSpeed;
    // Leaderboard logic
    let board = getLeaderboard();
    let qualifies = board.length < 10 || this.score > board[board.length - 1].score;
    if (qualifies) {
      // Prompt for name
      this.nameInput = document.createElement('input');
      this.nameInput.type = 'text';
      this.nameInput.maxLength = 12;
      this.nameInput.placeholder = 'Your Name';
      this.nameInput.style.position = 'absolute';
      this.nameInput.style.left = '50%';
      this.nameInput.style.top = '60%';
      this.nameInput.style.transform = 'translate(-50%, -50%)';
      this.nameInput.style.fontSize = '24px';
      this.nameInput.style.zIndex = '1000';
      document.body.appendChild(this.nameInput);
      this.nameInput.focus();
      this.nameInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          let name = this.nameInput.value.trim() || 'Player';
          board.push({ name, score: this.score });
          board.sort((a, b) => b.score - a.score);
          board = board.slice(0, 10);
          saveLeaderboard(board);
          this.leaderboard = board;
          document.body.removeChild(this.nameInput);
          this.nameInput = null;
          this.showLeaderboard();
        }
      };
    } else {
      this.showLeaderboard();
    }
    // Game Over panel
    this.gameOverPanel.setVisible(true);
    this.gameOverText.setVisible(true);
    this.statsText.setVisible(true);
    this.restartButton.setVisible(true);
    this.gameOverText.setText('GAME OVER');
    this.statsText.setText(
      `Final Score: ${this.score}\nHigh Score: ${this.progressManager.highScore}`
    );
    this.playerCar.reset();
    this.obstacleManager.reset();
  }
  showLeaderboard() {
    let board = this.leaderboard || [];
    let text = 'Leaderboard\n';
    board.forEach((entry, i) => {
      text += `${i + 1}. ${entry.name}: ${entry.score}\n`;
    });
    this.statsText.setText(
      `Final Score: ${this.score}\nHigh Score: ${this.progressManager.highScore}\n\n${text}`
    );
  }
  restart() {
    this.score = 0;
    this.lastScoreTime = 0;
    this.playerCar.reset();
    this.obstacleManager.reset();
    this.currentSpeed = this.baseSpeed; // Reset speed on restart
    this.startTime = 0;
    this.gameState = 'playing';
    this.gameOverPanel.setVisible(false);
    this.gameOverText.setVisible(false);
    this.statsText.setVisible(false);
    this.restartButton.setVisible(false);
    if (this.nameInput) {
      document.body.removeChild(this.nameInput);
      this.nameInput = null;
    }
  }
}
