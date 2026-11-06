export type GameState = 
  | 'TITLE_MENU' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'LEVEL_SELECT' 
  | 'LOCKER' 
  | 'LEADERBOARD' 
  | 'ACHIEVEMENTS' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type GameMode = 'LEVELS' | 'ENDLESS';

export type ObstacleType = 
  | 'ROLLING_ACORN' 
  | 'SPIKY_SEED' 
  | 'LOW_PIPE' 
  | 'ELECTRIC_SPARK' 
  | 'BOUNCY_MUSHROOM' 
  | 'PIT_GAP';

export type CollectibleType = 
  | 'SUNFLOWER_SEED' 
  | 'SQUEEK_COIN' 
  | 'DIAMOND_TOKEN' 
  | 'MAGNET' 
  | 'ENERGY_BOOST' 
  | 'SHIELD' 
  | 'DOUBLE_COINS';

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  passed: boolean;
  rotation?: number;
  speedMultiplier?: number;
  isHigh?: boolean; // Requires ducking/rolling under
}

export interface Collectible {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: CollectibleType;
  collected: boolean;
  floatOffset: number;
  value: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'star' | 'dust' | 'spark';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface PowerUpState {
  magnet: number; // Remaining duration in seconds
  energyBoost: number;
  shield: boolean;
  doubleCoins: number;
}

export interface HamsterSkin {
  id: string;
  name: string;
  description: string;
  price: number; // In SQUEEK coins
  unlocked: boolean;
  primaryColor: string;
  bellyColor: string;
  earColor: string;
  accessory: 'none' | 'goggles' | 'cyber_visor' | 'astro_helmet' | 'wizard_hat' | 'gold_crown' | 'ninja_headband';
  trailColor?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  theme: 'cage' | 'tubes' | 'garden' | 'cyber' | 'space';
  targetDistance: number;
  baseSpeed: number;
  gravity: number;
  jumpForce: number;
  obstacleFrequency: number;
  backgroundColorTop: string;
  backgroundColorBottom: string;
  groundColor: string;
  wheelAccentColor: string;
  ambientParticles: 'sawdust' | 'bubbles' | 'leaves' | 'neon_sparks' | 'space_stars';
  unlocked: boolean;
  highScore: number;
  stars: number; // 0-3 stars based on coins/score
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  rewardCoins: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  distance: number;
  coins: number;
  skinName: string;
  isPlayer?: boolean;
}

export interface PlayerStats {
  totalRuns: number;
  totalDistance: number;
  totalCoins: number;
  highestScore: number;
  highestCombo: number;
  unlockedSkins: string[];
  selectedSkin: string;
  unlockedLevels: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}
