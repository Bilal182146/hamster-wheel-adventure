import {
  LevelConfig,
  HamsterSkin,
  PowerUpState,
  Obstacle,
  ObstacleType,
  Collectible,
  CollectibleType,
  Particle,
  FloatingText,
  GameMode,
} from '../types/game';
import { HamsterRenderer, HamsterAnimState } from './HamsterRenderer';
import { audio } from '../utils/audio';

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onCoinsChange: (coins: number) => void;
  onDistanceChange: (distance: number) => void;
  onComboChange: (combo: number) => void;
  onPowerUpsChange: (powerUps: PowerUpState) => void;
  onGameOver: (finalStats: { score: number; distance: number; coins: number; comboPeak: number }) => void;
  onVictory: (finalStats: { score: number; distance: number; coins: number; stars: number }) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Configuration
  private level: LevelConfig;
  private skin: HamsterSkin;
  private mode: GameMode;
  private callbacks: GameCallbacks;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // World dimensions
  private worldWidth: number = 800;
  private worldHeight: number = 450;
  private groundY: number = 360;

  // Hamster State
  private hamster: HamsterAnimState = {
    x: 100,
    y: 300,
    width: 44,
    height: 44,
    vy: 0,
    isGrounded: true,
    isRolling: false,
    isDoubleJumping: false,
    spinAngle: 0,
    runCycle: 0,
    invincibleTimer: 0,
  };

  private canDoubleJump: boolean = true;
  private rollTimer: number = 0;

  // Game Stats
  public score: number = 0;
  public coinsEarned: number = 0;
  public distance: number = 0;
  public currentSpeed: number = 5.5;
  public combo: number = 1;
  public comboTimer: number = 0;
  public comboPeak: number = 1;

  // Game Objects
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Power-Ups
  private powerUps: PowerUpState = {
    magnet: 0,
    energyBoost: 0,
    shield: false,
    doubleCoins: 0,
  };

  // Spawning clocks
  private nextObstacleDist: number = 350;
  private nextCollectibleDist: number = 180;
  private objectIdCounter: number = 1;

  // Wheel graphic & backdrop rotation
  private wheelRotation: number = 0;
  private screenShake: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    skin: HamsterSkin,
    mode: GameMode,
    callbacks: GameCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.skin = skin;
    this.mode = mode;
    this.callbacks = callbacks;

    this.currentSpeed = level.baseSpeed;
    this.resetPlayerPosition();
  }

  public updateSkin(skin: HamsterSkin) {
    this.skin = skin;
  }

  public setSize(width: number, height: number) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.groundY = Math.floor(height * 0.80);
    this.resetPlayerPosition();
  }

  private resetPlayerPosition() {
    this.hamster.x = Math.max(70, Math.floor(this.worldWidth * 0.16));
    this.hamster.y = this.groundY - this.hamster.height;
    this.hamster.vy = 0;
    this.hamster.isGrounded = true;
    this.hamster.isRolling = false;
    this.hamster.isDoubleJumping = false;
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // Input Handlers
  public handleJump() {
    if (!this.isRunning || this.isPaused) return;

    if (this.hamster.isGrounded) {
      // First jump
      this.hamster.vy = this.level.jumpForce;
      this.hamster.isGrounded = false;
      this.canDoubleJump = true;
      this.hamster.isRolling = false;
      audio.playJump();
      this.spawnDust(this.hamster.x + 10, this.groundY, 6);
    } else if (this.canDoubleJump) {
      // Double jump acrobatic spin
      this.hamster.vy = this.level.jumpForce * 0.88;
      this.canDoubleJump = false;
      this.hamster.isDoubleJumping = true;
      this.hamster.spinAngle = 0;
      audio.playDoubleJump();
      this.spawnSparkles(this.hamster.x + 20, this.hamster.y + 20, 8, '#fbbf24');
    }
  }

  public handleRoll() {
    if (!this.isRunning || this.isPaused) return;

    this.hamster.isRolling = true;
    this.rollTimer = 0.55; // Roll duration in seconds
    audio.playRoll();

    if (!this.hamster.isGrounded) {
      // Quick dive downward if in mid-air
      this.hamster.vy = Math.max(this.hamster.vy, 11);
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning || this.isPaused) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap dt to prevent tunneling
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Advance distance & speed
    const frameDistance = this.currentSpeed * 60 * dt;
    this.distance += frameDistance * 0.1;

    // Speed scaling
    if (this.mode === 'ENDLESS') {
      this.currentSpeed = Math.min(this.level.baseSpeed + (this.distance / 400) * 0.35, 14.5);
    } else {
      this.currentSpeed = Math.min(this.level.baseSpeed + (this.distance / 500) * 0.25, 13.0);
    }

    // Wheel rotation speed
    this.wheelRotation += (this.currentSpeed * dt * 0.85);

    // Score accumulation
    this.score += Math.floor(frameDistance * 0.2 * this.combo);

    // 2. Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.callbacks.onComboChange(1);
      }
    }

    // 3. Power-Up Timers
    let powerUpsChanged = false;
    if (this.powerUps.magnet > 0) {
      this.powerUps.magnet = Math.max(0, this.powerUps.magnet - dt);
      powerUpsChanged = true;
    }
    if (this.powerUps.energyBoost > 0) {
      this.powerUps.energyBoost = Math.max(0, this.powerUps.energyBoost - dt);
      powerUpsChanged = true;
    }
    if (this.powerUps.doubleCoins > 0) {
      this.powerUps.doubleCoins = Math.max(0, this.powerUps.doubleCoins - dt);
      powerUpsChanged = true;
    }
    if (powerUpsChanged) {
      this.callbacks.onPowerUpsChange(this.powerUps);
    }

    // Invincible recovery timer
    if (this.hamster.invincibleTimer > 0) {
      this.hamster.invincibleTimer = Math.max(0, this.hamster.invincibleTimer - dt);
    }

    // 4. Screen Shake Decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 5. Hamster Physics
    // Rolling timer
    if (this.hamster.isRolling) {
      this.rollTimer -= dt;
      if (this.rollTimer <= 0) {
        this.hamster.isRolling = false;
      }
    }

    // Double jump spin angle
    if (this.hamster.isDoubleJumping) {
      this.hamster.spinAngle += dt * 14;
      if (this.hamster.spinAngle >= Math.PI * 2) {
        this.hamster.spinAngle = 0;
        this.hamster.isDoubleJumping = false;
      }
    }

    // Run cycle animation
    this.hamster.runCycle += dt * this.currentSpeed * 2.8;

    // Gravity & Vertical Velocity
    this.hamster.vy += this.level.gravity * (60 * dt);
    this.hamster.y += this.hamster.vy * (60 * dt);

    // Ground collision
    const normalHeight = 44;
    const rollHeight = 26;
    this.hamster.height = this.hamster.isRolling ? rollHeight : normalHeight;
    this.hamster.width = this.hamster.isRolling ? 34 : 44;

    const effectiveGround = this.groundY - this.hamster.height;
    if (this.hamster.y >= effectiveGround) {
      this.hamster.y = effectiveGround;
      this.hamster.vy = 0;
      if (!this.hamster.isGrounded) {
        this.hamster.isGrounded = true;
        this.canDoubleJump = true;
        this.hamster.isDoubleJumping = false;
        this.spawnDust(this.hamster.x + 15, this.groundY, 5);
      }
    }

    // 6. Spawn Obstacles
    this.nextObstacleDist -= frameDistance;
    if (this.nextObstacleDist <= 0) {
      this.spawnObstacle();
      const minGap = 260 / this.level.obstacleFrequency;
      const maxGap = 480 / this.level.obstacleFrequency;
      this.nextObstacleDist = minGap + Math.random() * (maxGap - minGap);
    }

    // 7. Spawn Collectibles
    this.nextCollectibleDist -= frameDistance;
    if (this.nextCollectibleDist <= 0) {
      this.spawnCollectibleGroup();
      this.nextCollectibleDist = 180 + Math.random() * 220;
    }

    // 8. Update Obstacles & Check Collision
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= frameDistance * (obs.speedMultiplier || 1);

      if (obs.type === 'ROLLING_ACORN') {
        obs.rotation = (obs.rotation || 0) - frameDistance * 0.08;
      }

      // Check collision
      if (!obs.passed && this.checkCollision(obs)) {
        if (obs.type === 'BOUNCY_MUSHROOM') {
          // Spring bounce!
          this.hamster.vy = this.level.jumpForce * 1.35;
          this.hamster.isGrounded = false;
          this.canDoubleJump = true;
          this.hamster.isDoubleJumping = true;
          audio.playBounce();
          this.addFloatingText(obs.x, obs.y - 20, 'SUPER BOUNCE! 🚀', '#38bdf8');
          this.spawnSparkles(obs.x + obs.width / 2, obs.y, 10, '#38bdf8');
          obs.passed = true;
        } else if (this.powerUps.energyBoost > 0) {
          // Smash right through!
          obs.passed = true;
          this.score += 150;
          this.spawnSparkles(obs.x + obs.width / 2, obs.y + obs.height / 2, 12, '#f59e0b');
          this.addFloatingText(obs.x, obs.y - 15, 'SMASH! +150', '#fbbf24');
          audio.playBounce();
        } else if (this.powerUps.shield) {
          // Shield absorbs the blow!
          this.powerUps.shield = false;
          obs.passed = true;
          this.screenShake = 6;
          this.hamster.invincibleTimer = 1.2;
          audio.playHit();
          this.addFloatingText(this.hamster.x, this.hamster.y - 20, 'SHIELD BROKEN!', '#38bdf8');
          this.callbacks.onPowerUpsChange(this.powerUps);
        } else if (this.hamster.invincibleTimer <= 0) {
          // Player hit!
          this.handleHit();
          return;
        }
      }

      // Passed check
      if (obs.x + obs.width < this.hamster.x && !obs.passed) {
        obs.passed = true;
      }

      // Remove off-screen
      if (obs.x < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // 9. Update Collectibles & Magnet suction
    const magnetActive = this.powerUps.magnet > 0;
    const hamsterCenterX = this.hamster.x + this.hamster.width / 2;
    const hamsterCenterY = this.hamster.y + this.hamster.height / 2;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.x -= frameDistance;

      // Magnet physics
      if (magnetActive && !col.collected) {
        const dx = hamsterCenterX - col.x;
        const dy = hamsterCenterY - col.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 260) {
          const speed = (260 - dist) * 0.08 + 6;
          col.x += (dx / dist) * speed;
          col.y += (dy / dist) * speed;
        }
      }

      // Collision check
      if (!col.collected && this.checkCollectibleCollision(col)) {
        col.collected = true;
        this.collectItem(col);
      }

      // Remove off-screen
      if (col.x < -60 || col.collected) {
        this.collectibles.splice(i, 1);
      }
    }

    // 10. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 11. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * (60 * dt);
      t.alpha -= dt * 1.4;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 12. Ambient particles (sawdust, stars, etc.)
    if (Math.random() < 0.25) {
      this.spawnAmbientParticle();
    }

    // 13. Check Level Victory condition
    if (this.mode === 'LEVELS' && this.distance >= this.level.targetDistance) {
      this.handleVictory();
      return;
    }

    // Sync callbacks periodically
    this.callbacks.onScoreChange(this.score);
    this.callbacks.onDistanceChange(Math.floor(this.distance));
  }

  private checkCollision(obs: Obstacle): boolean {
    // If obstacle is a low pipe (overhead), player only collides if NOT rolling!
    if (obs.isHigh) {
      if (this.hamster.isRolling) {
        return false; // Safely ducked underneath!
      }
    }

    const padding = 5;
    const hx = this.hamster.x + padding;
    const hy = this.hamster.y + padding;
    const hw = this.hamster.width - padding * 2;
    const hh = this.hamster.height - padding * 2;

    const ox = obs.x + padding;
    const oy = obs.y + padding;
    const ow = obs.width - padding * 2;
    const oh = obs.height - padding * 2;

    return (
      hx < ox + ow &&
      hx + hw > ox &&
      hy < oy + oh &&
      hy + hh > oy
    );
  }

  private checkCollectibleCollision(col: Collectible): boolean {
    const hx = this.hamster.x;
    const hy = this.hamster.y;
    const hw = this.hamster.width;
    const hh = this.hamster.height;

    return (
      hx < col.x + col.width &&
      hx + hw > col.x &&
      hy < col.y + col.height &&
      hy + hh > col.y
    );
  }

  private collectItem(col: Collectible) {
    let coinsToAdd = 0;
    const isDouble = this.powerUps.doubleCoins > 0;

    switch (col.type) {
      case 'SUNFLOWER_SEED':
        this.score += 25 * this.combo;
        coinsToAdd = isDouble ? 2 : 1;
        this.addCombo();
        audio.playCoin(this.combo);
        this.spawnSparkles(col.x, col.y, 4, '#f59e0b');
        this.addFloatingText(col.x, col.y - 12, `+${25 * this.combo}`, '#fef08a');
        break;

      case 'SQUEEK_COIN':
        this.score += 100 * this.combo;
        coinsToAdd = isDouble ? 10 : 5;
        this.addCombo();
        audio.playCoin(this.combo + 2);
        this.spawnSparkles(col.x, col.y, 8, '#fbbf24');
        this.addFloatingText(col.x, col.y - 14, `+$SQUEEK (${coinsToAdd})`, '#fbbf24');
        break;

      case 'DIAMOND_TOKEN':
        this.score += 350 * this.combo;
        coinsToAdd = isDouble ? 50 : 25;
        this.addCombo(2);
        audio.playPowerup();
        this.spawnSparkles(col.x, col.y, 14, '#38bdf8');
        this.addFloatingText(col.x, col.y - 16, `💎 DIAMOND! +${coinsToAdd}`, '#38bdf8');
        break;

      case 'MAGNET':
        this.powerUps.magnet = 9.0;
        audio.playPowerup();
        this.addFloatingText(col.x, col.y - 15, '🧲 MAGNET ACTIVE!', '#fbbf24');
        this.callbacks.onPowerUpsChange(this.powerUps);
        break;

      case 'ENERGY_BOOST':
        this.powerUps.energyBoost = 7.0;
        audio.playPowerup();
        this.addFloatingText(col.x, col.y - 15, '⚡ TURBO SQUEEK!', '#ef4444');
        this.callbacks.onPowerUpsChange(this.powerUps);
        break;

      case 'SHIELD':
        this.powerUps.shield = true;
        audio.playPowerup();
        this.addFloatingText(col.x, col.y - 15, '🛡️ SHIELD READY!', '#38bdf8');
        this.callbacks.onPowerUpsChange(this.powerUps);
        break;

      case 'DOUBLE_COINS':
        this.powerUps.doubleCoins = 10.0;
        audio.playPowerup();
        this.addFloatingText(col.x, col.y - 15, '2X $SQUEEK TOKENS!', '#10b981');
        this.callbacks.onPowerUpsChange(this.powerUps);
        break;
    }

    if (coinsToAdd > 0) {
      this.coinsEarned += coinsToAdd;
      this.callbacks.onCoinsChange(this.coinsEarned);
    }
  }

  private addCombo(amount: number = 1) {
    this.combo = Math.min(this.combo + amount, 10);
    this.comboTimer = 3.5; // Combo resets if no coin for 3.5 seconds
    if (this.combo > this.comboPeak) {
      this.comboPeak = this.combo;
    }
    this.callbacks.onComboChange(this.combo);

    if (this.combo >= 4 && this.combo % 2 === 0) {
      this.addFloatingText(
        this.hamster.x,
        this.hamster.y - 28,
        `COMBO x${this.combo}! 🔥`,
        '#f59e0b'
      );
    }
  }

  private handleHit() {
    this.isRunning = false;
    this.screenShake = 12;
    audio.playHit();
    this.spawnDust(this.hamster.x + 20, this.hamster.y + 20, 16);

    setTimeout(() => {
      this.callbacks.onGameOver({
        score: this.score,
        distance: Math.floor(this.distance),
        coins: this.coinsEarned,
        comboPeak: this.comboPeak,
      });
    }, 450);
  }

  private handleVictory() {
    this.isRunning = false;
    audio.playVictory();

    // Calculate stars: 1 star for clear, 2 stars for score > 1500, 3 stars for comboPeak >= 5
    let stars = 1;
    if (this.coinsEarned >= 20 || this.score > 2500) stars = 2;
    if (stars === 2 && this.comboPeak >= 4) stars = 3;

    setTimeout(() => {
      this.callbacks.onVictory({
        score: this.score,
        distance: Math.floor(this.distance),
        coins: this.coinsEarned,
        stars,
      });
    }, 450);
  }

  private spawnObstacle() {
    const types: ObstacleType[] = [
      'ROLLING_ACORN',
      'SPIKY_SEED',
      'LOW_PIPE',
      'BOUNCY_MUSHROOM',
    ];

    if (this.level.theme === 'cyber') {
      types.push('ELECTRIC_SPARK');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const id = this.objectIdCounter++;

    let width = 34;
    let height = 34;
    let y = this.groundY - height;
    let isHigh = false;
    let speedMultiplier = 1;

    switch (type) {
      case 'ROLLING_ACORN':
        width = 30;
        height = 30;
        y = this.groundY - height;
        speedMultiplier = 1.35; // Rolls towards player!
        break;

      case 'SPIKY_SEED':
        width = 36;
        height = 38;
        y = this.groundY - height;
        break;

      case 'LOW_PIPE':
        width = 46;
        height = 48;
        // Suspended overhead - requires ducking/rolling!
        y = this.groundY - 62;
        isHigh = true;
        break;

      case 'BOUNCY_MUSHROOM':
        width = 38;
        height = 30;
        y = this.groundY - height;
        break;

      case 'ELECTRIC_SPARK':
        width = 32;
        height = 42;
        y = this.groundY - height;
        break;
    }

    this.obstacles.push({
      id,
      x: this.worldWidth + 60,
      y,
      width,
      height,
      type,
      passed: false,
      rotation: 0,
      speedMultiplier,
      isHigh,
    });
  }

  private spawnCollectibleGroup() {
    const roll = Math.random();
    let type: CollectibleType = 'SUNFLOWER_SEED';

    if (roll < 0.20) {
      type = 'SQUEEK_COIN';
    } else if (roll < 0.25) {
      type = 'DIAMOND_TOKEN';
    } else if (roll < 0.35) {
      const powerups: CollectibleType[] = ['MAGNET', 'ENERGY_BOOST', 'SHIELD', 'DOUBLE_COINS'];
      type = powerups[Math.floor(Math.random() * powerups.length)];
    }

    // Pattern: single, arc of 3, or line of 3
    const pattern = Math.random() < 0.5 ? 'arc' : 'line';
    const count = type === 'SUNFLOWER_SEED' ? (pattern === 'arc' ? 4 : 3) : 1;

    for (let i = 0; i < count; i++) {
      const id = this.objectIdCounter++;
      let x = this.worldWidth + 60 + i * 38;
      let y = this.groundY - 50;

      if (pattern === 'arc' && count > 1) {
        // High arc over potential jump
        const progress = i / (count - 1); // 0 to 1
        const arcY = Math.sin(progress * Math.PI) * 55;
        y = this.groundY - 55 - arcY;
      }

      this.collectibles.push({
        id,
        x,
        y,
        width: 24,
        height: 24,
        type,
        collected: false,
        floatOffset: Math.random() * Math.PI * 2,
        value: type === 'SUNFLOWER_SEED' ? 10 : 50,
      });
    }
  }

  private spawnDust(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: this.objectIdCounter++,
        x: x + (Math.random() - 0.5) * 12,
        y: y - 2,
        vx: -(this.currentSpeed * 0.4) - Math.random() * 2,
        vy: -Math.random() * 2.5,
        size: 3 + Math.random() * 4,
        color: 'rgba(255, 255, 255, 0.45)',
        alpha: 0.8,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        shape: 'dust',
      });
    }
  }

  private spawnSparkles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        id: this.objectIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.65,
        shape: 'spark',
      });
    }
  }

  private spawnAmbientParticle() {
    let color = 'rgba(254, 240, 138, 0.3)';
    if (this.level.theme === 'cyber') color = 'rgba(6, 182, 212, 0.4)';
    if (this.level.theme === 'garden') color = 'rgba(74, 222, 128, 0.3)';
    if (this.level.theme === 'space') color = 'rgba(255, 255, 255, 0.7)';

    this.particles.push({
      id: this.objectIdCounter++,
      x: this.worldWidth + 20,
      y: Math.random() * (this.groundY - 40),
      vx: -(this.currentSpeed * 0.3) - Math.random() * 1.5,
      vy: (Math.random() - 0.5) * 0.8,
      size: 2 + Math.random() * 3,
      color,
      alpha: 0.6,
      life: 3.5,
      maxLife: 3.5,
      shape: 'circle',
    });
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: this.objectIdCounter++,
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  }

  // ================= RENDER PIPELINE =================
  private render() {
    const ctx = this.ctx;
    const w = this.worldWidth;
    const h = this.worldHeight;

    ctx.save();

    // Screen Shake effect
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky / Room Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, this.level.backgroundColorTop);
    bgGrad.addColorStop(1, this.level.backgroundColorBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Parallax Backdrop Elements (Theme-Specific)
    this.drawParallaxBackdrop(ctx, w, h);

    // 3. The Giant Hamster Wheel (Centerpiece of the adventure!)
    this.drawHamsterWheel(ctx, w, h);

    // 4. Ground Track / Treadmill
    this.drawGround(ctx, w, h);

    // 5. Draw Collectibles
    this.drawCollectibles(ctx);

    // 6. Draw Obstacles
    this.drawObstacles(ctx);

    // 7. Draw Hamster Character
    HamsterRenderer.drawHamster(
      ctx,
      this.hamster,
      this.skin,
      this.powerUps,
      this.level.theme
    );

    // 8. Draw Particles
    this.drawParticles(ctx);

    // 9. Draw Floating Combo Texts
    this.drawFloatingTexts(ctx);

    ctx.restore();
  }

  private drawParallaxBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const offset = (this.distance * 0.15) % 300;

    switch (this.level.theme) {
      case 'space': {
        // Starfield
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
          const sx = ((i * 73 - offset * 0.5) % w + w) % w;
          const sy = (i * 47) % (this.groundY - 60);
          const size = (i % 3 === 0) ? 2 : 1;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Distant Earth / Squeek Planet
        ctx.beginPath();
        ctx.arc(w * 0.85, 90, 42, 0, Math.PI * 2);
        ctx.fillStyle = '#1d4ed8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.82, 85, 38, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        break;
      }

      case 'cyber': {
        // Digital Neon Grid lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
        ctx.lineWidth = 1;
        const gridOffset = (this.distance * 0.8) % 40;
        for (let x = -gridOffset; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.groundY);
          ctx.stroke();
        }
        for (let y = 30; y < this.groundY; y += 35) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        break;
      }

      case 'garden': {
        // Distant hills and daisy flowers
        ctx.fillStyle = 'rgba(22, 101, 52, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        for (let x = 0; x <= w; x += 60) {
          const hillY = this.groundY - 45 - Math.sin((x + offset) * 0.02) * 20;
          ctx.lineTo(x, hillY);
        }
        ctx.lineTo(w, this.groundY);
        ctx.fill();
        break;
      }

      case 'tubes': {
        // Giant colorful interlocking hamster tubes
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 110);
        ctx.bezierCurveTo(w * 0.3, 80, w * 0.7, 180, w, 120);
        ctx.stroke();
        break;
      }

      case 'cage':
      default: {
        // Cozy bedroom wall wainscoting & sunny window glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let x = -((this.distance * 0.1) % 80); x < w; x += 80) {
          ctx.fillRect(x, 0, 40, this.groundY);
        }
        // Warm ceiling light cone
        const lightGrad = ctx.createRadialGradient(w * 0.5, 0, 10, w * 0.5, 0, 320);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.15)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, w, this.groundY);
        break;
      }
    }

    ctx.restore();
  }

  private drawHamsterWheel(ctx: CanvasRenderingContext2D, w: number, _h: number) {
    ctx.save();
    // Wheel center sits below the ground line so the top arc forms the track area
    const wheelCenterX = w * 0.5;
    const wheelCenterY = this.groundY + 110;
    const wheelRadius = 180;

    ctx.translate(wheelCenterX, wheelCenterY);
    ctx.rotate(this.wheelRotation);

    // 1. Wheel Outer Rim
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.level.wheelAccentColor;
    ctx.lineWidth = 14;
    ctx.stroke();

    // Inner rim line
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Wheel Spokes
    const spokeCount = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (wheelRadius - 5), Math.sin(angle) * (wheelRadius - 5));
      ctx.stroke();

      // Colorful tread grips along rim
      const gripX = Math.cos(angle) * (wheelRadius);
      const gripY = Math.sin(angle) * (wheelRadius);
      ctx.beginPath();
      ctx.arc(gripX, gripY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // 3. Wheel Axle Hub
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = this.level.wheelAccentColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();

    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    // Ground base
    ctx.fillStyle = this.level.groundColor;
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    // Track surface highlight strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, this.groundY, w, 4);

    // Tread lines moving with speed
    const step = 32;
    const offset = (this.distance * 1.5) % step;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    for (let x = -offset; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY + 4);
      ctx.lineTo(x + 12, this.groundY + 22);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      ctx.save();

      switch (obs.type) {
        case 'ROLLING_ACORN': {
          ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
          ctx.rotate(obs.rotation || 0);
          // Acorn nut
          ctx.beginPath();
          ctx.ellipse(0, 2, 14, 12, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#b45309';
          ctx.fill();
          // Acorn textured cap
          ctx.beginPath();
          ctx.ellipse(0, -7, 13, 7, 0, Math.PI, Math.PI * 2);
          ctx.fillStyle = '#78350f';
          ctx.fill();
          // Stem
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-2, -13, 4, 6);
          break;
        }

        case 'SPIKY_SEED': {
          // Sharp burr / spiky chestnut husk
          const cx = obs.x + obs.width / 2;
          const cy = obs.y + obs.height / 2;
          ctx.translate(cx, cy);

          ctx.beginPath();
          const spikes = 9;
          const outerR = 17;
          const innerR = 10;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (i * Math.PI) / spikes;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = '#dc2626';
          ctx.fill();
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Angry spiky eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -4, 3, 3);
          ctx.fillRect(3, -4, 3, 3);
          break;
        }

        case 'LOW_PIPE': {
          // Overhead industrial tube - requires rolling underneath!
          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          // Danger caution hazard stripes
          ctx.save();
          ctx.beginPath();
          ctx.rect(obs.x, obs.y, obs.width, 12);
          ctx.clip();
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(obs.x, obs.y, obs.width, 12);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 5;
          for (let lx = obs.x - 20; lx < obs.x + obs.width + 20; lx += 12) {
            ctx.beginPath();
            ctx.moveTo(lx, obs.y);
            ctx.lineTo(lx + 10, obs.y + 12);
            ctx.stroke();
          }
          ctx.restore();

          // Arrow pointing down indicating "ROLL UNDER"
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2 - 6, obs.y + obs.height - 10);
          ctx.lineTo(obs.x + obs.width / 2 + 6, obs.y + obs.height - 10);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height - 3);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'BOUNCY_MUSHROOM': {
          // Spring bounce mushroom
          const mx = obs.x + obs.width / 2;
          const my = obs.y + obs.height;
          // Stem
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(mx - 6, my - 16, 12, 16);
          // Spring coils behind stem
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(mx - 8, my - 4);
          ctx.lineTo(mx + 8, my - 8);
          ctx.lineTo(mx - 8, my - 12);
          ctx.stroke();

          // Cap (bouncy rubber dome)
          ctx.beginPath();
          ctx.arc(mx, my - 16, 18, Math.PI, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          // White polka dots
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mx, my - 24, 3, 0, Math.PI * 2);
          ctx.arc(mx - 9, my - 20, 2.5, 0, Math.PI * 2);
          ctx.arc(mx + 9, my - 20, 2.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'ELECTRIC_SPARK': {
          // Neon Tesla zapper
          ctx.fillStyle = '#334155';
          ctx.fillRect(obs.x + 8, obs.y + obs.height - 10, obs.width - 16, 10);

          // Animated electric lightning
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height - 10);
          ctx.lineTo(obs.x + obs.width / 2 - 6, obs.y + 20);
          ctx.lineTo(obs.x + obs.width / 2 + 7, obs.y + 12);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.stroke();

          // Glow orb on top
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#67e8f9';
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }
  }

  private drawCollectibles(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.005;

    for (const col of this.collectibles) {
      ctx.save();
      const floatY = Math.sin(time + col.floatOffset) * 4;
      const cx = col.x + col.width / 2;
      const cy = col.y + col.height / 2 + floatY;

      ctx.translate(cx, cy);

      switch (col.type) {
        case 'SUNFLOWER_SEED': {
          // Pointed sunflower seed
          ctx.rotate(-0.3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, 11, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#334155';
          ctx.fill();
          // Golden white stripe down the center
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(0, 9);
          ctx.stroke();
          break;
        }

        case 'SQUEEK_COIN': {
          // Golden $SQUEEK Crypto-Token
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Paw print emblem inside
          ctx.fillStyle = '#ffffff';
          // Main paw pad
          ctx.beginPath();
          ctx.arc(0, 2, 4, 0, Math.PI * 2);
          ctx.fill();
          // 3 toe dots
          ctx.beginPath();
          ctx.arc(-4, -3, 1.8, 0, Math.PI * 2);
          ctx.arc(0, -5, 1.8, 0, Math.PI * 2);
          ctx.arc(4, -3, 1.8, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'DIAMOND_TOKEN': {
          // Sparkling Diamond
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(10, -2);
          ctx.lineTo(0, 12);
          ctx.lineTo(-10, -2);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          break;
        }

        case 'MAGNET': {
          // Red-and-Silver Horseshoe magnet
          ctx.beginPath();
          ctx.arc(0, 0, 12, Math.PI, Math.PI * 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 5;
          ctx.stroke();
          // Silver tips
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-14.5, 0, 5, 6);
          ctx.fillRect(9.5, 0, 5, 6);
          break;
        }

        case 'ENERGY_BOOST': {
          // Lightning bolt badge
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          // Bolt
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(2, -8);
          ctx.lineTo(-5, 0);
          ctx.lineTo(0, 0);
          ctx.lineTo(-2, 8);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'SHIELD': {
          // Cyan shield
          ctx.beginPath();
          ctx.moveTo(-9, -8);
          ctx.lineTo(9, -8);
          ctx.lineTo(9, 1);
          ctx.quadraticCurveTo(9, 10, 0, 13);
          ctx.quadraticCurveTo(-9, 10, -9, 1);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          break;
        }

        case 'DOUBLE_COINS': {
          // 2X badge
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('2X', 0, 1);
          break;
        }
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'dust') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 1.5, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);

      // Fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      ctx.restore();
    }
  }
}
