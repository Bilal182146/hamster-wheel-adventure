import { PlayerStats, Achievement, LeaderboardEntry, LevelConfig } from '../types/game';

const STORAGE_KEY_STATS = 'squeek_hamster_stats_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'squeek_hamster_achievements_v1';
const STORAGE_KEY_LEADERBOARD = 'squeek_hamster_leaderboard_v1';
const STORAGE_KEY_LEVELS = 'squeek_hamster_levels_v1';

export const INITIAL_SKINS = [
  {
    id: 'classic',
    name: 'Classic Syrian',
    description: 'The beloved energetic golden hamster who started the SqueekChain revolution.',
    price: 0,
    unlocked: true,
    primaryColor: '#e09848',
    bellyColor: '#fff1de',
    earColor: '#fca5a5',
    accessory: 'none' as const,
  },
  {
    id: 'goggles',
    name: 'Speedster Barnaby',
    description: 'Equipped with aerodynamic aviator goggles for supersonic wheel spins.',
    price: 150,
    unlocked: false,
    primaryColor: '#c27632',
    bellyColor: '#fbe2c5',
    earColor: '#f87171',
    accessory: 'goggles' as const,
    trailColor: '#fbbf24',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Squeek',
    description: 'Direct neural interface with the SqueekChain ledger. Features neon visor.',
    price: 350,
    unlocked: false,
    primaryColor: '#06b6d4',
    bellyColor: '#cffafe',
    earColor: '#22d3ee',
    accessory: 'cyber_visor' as const,
    trailColor: '#06b6d4',
  },
  {
    id: 'astro',
    name: 'Astro-Paws',
    description: 'Trained at Hamster Space Command. Zero-g bubble helmet for cosmic jumps.',
    price: 600,
    unlocked: false,
    primaryColor: '#e2e8f0',
    bellyColor: '#f8fafc',
    earColor: '#94a3b8',
    accessory: 'astro_helmet' as const,
    trailColor: '#a855f7',
  },
  {
    id: 'wizard',
    name: 'Grand Squeek-Mage',
    description: 'Wields the mystical Golden Sunflower Staff and enchanted wizard hat.',
    price: 900,
    unlocked: false,
    primaryColor: '#7c3aed',
    bellyColor: '#ede9fe',
    earColor: '#c4b5fd',
    accessory: 'wizard_hat' as const,
    trailColor: '#e879f9',
  },
  {
    id: 'diamond',
    name: 'Diamond Paws Millionaire',
    description: 'Solid 24k polished gold fur and crown for true SqueekChain Hodlers.',
    price: 1500,
    unlocked: false,
    primaryColor: '#f59e0b',
    bellyColor: '#fef3c7',
    earColor: '#fbbf24',
    accessory: 'gold_crown' as const,
    trailColor: '#fbbf24',
  },
];

export const INITIAL_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Cozy Cage & Cedar Shavings',
    subtitle: 'Warm afternoon room, soft sawdust, gentle wooden wheel',
    theme: 'cage',
    targetDistance: 800,
    baseSpeed: 5.5,
    gravity: 0.58,
    jumpForce: -13.5,
    obstacleFrequency: 1.4,
    backgroundColorTop: '#1e1b4b',
    backgroundColorBottom: '#312e81',
    groundColor: '#78350f',
    wheelAccentColor: '#f59e0b',
    ambientParticles: 'sawdust',
    unlocked: true,
    highScore: 0,
    stars: 0,
  },
  {
    id: 2,
    name: 'Tubular Tunnels & Playroom',
    subtitle: 'Colorful modular plastic tunnels and bouncy spring toys',
    theme: 'tubes',
    targetDistance: 1200,
    baseSpeed: 6.5,
    gravity: 0.60,
    jumpForce: -13.8,
    obstacleFrequency: 1.8,
    backgroundColorTop: '#0f172a',
    backgroundColorBottom: '#1e293b',
    groundColor: '#0284c7',
    wheelAccentColor: '#38bdf8',
    ambientParticles: 'bubbles',
    unlocked: false,
    highScore: 0,
    stars: 0,
  },
  {
    id: 3,
    name: 'Backyard Garden Adventure',
    subtitle: 'Lush grass, clover bushes, pebble hurdles and ladybugs',
    theme: 'garden',
    targetDistance: 1600,
    baseSpeed: 7.2,
    gravity: 0.62,
    jumpForce: -14.0,
    obstacleFrequency: 2.1,
    backgroundColorTop: '#064e3b',
    backgroundColorBottom: '#065f46',
    groundColor: '#15803d',
    wheelAccentColor: '#4ade80',
    ambientParticles: 'leaves',
    unlocked: false,
    highScore: 0,
    stars: 0,
  },
  {
    id: 4,
    name: 'Cyber SqueekChain Mainnet',
    subtitle: 'High speed digital ledger wheel with laser barriers and crypto nodes',
    theme: 'cyber',
    targetDistance: 2200,
    baseSpeed: 8.0,
    gravity: 0.65,
    jumpForce: -14.5,
    obstacleFrequency: 2.5,
    backgroundColorTop: '#050515',
    backgroundColorBottom: '#0f172a',
    groundColor: '#6366f1',
    wheelAccentColor: '#06b6d4',
    ambientParticles: 'neon_sparks',
    unlocked: false,
    highScore: 0,
    stars: 0,
  },
  {
    id: 5,
    name: 'Moonbase Hamster Orbit',
    subtitle: 'Low gravity floaty leaps over lunar craters towards the stars',
    theme: 'space',
    targetDistance: 2800,
    baseSpeed: 8.8,
    gravity: 0.45, // Floaty moon gravity!
    jumpForce: -12.5,
    obstacleFrequency: 2.8,
    backgroundColorTop: '#030712',
    backgroundColorBottom: '#111827',
    groundColor: '#4b5563',
    wheelAccentColor: '#e0e7ff',
    ambientParticles: 'space_stars',
    unlocked: false,
    highScore: 0,
    stars: 0,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_run',
    title: 'First Spin',
    description: 'Begin your very first run on the hamster wheel.',
    iconName: 'Footprints',
    rewardCoins: 25,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'distance_500',
    title: 'Tireless Trotter',
    description: 'Run 500 meters in a single adventure.',
    iconName: 'Navigation',
    rewardCoins: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 500,
  },
  {
    id: 'distance_1500',
    title: 'Marathon Hammy',
    description: 'Run 1,500 meters in a single adventure.',
    iconName: 'Compass',
    rewardCoins: 120,
    unlocked: false,
    progress: 0,
    maxProgress: 1500,
  },
  {
    id: 'coins_100',
    title: 'Seed Stasher',
    description: 'Accumulate a total of 100 $SQUEEK coins.',
    iconName: 'Coins',
    rewardCoins: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'coins_500',
    title: 'Hamster Whale',
    description: 'Accumulate a total of 500 $SQUEEK coins.',
    iconName: 'Wallet',
    rewardCoins: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 500,
  },
  {
    id: 'combo_5',
    title: 'Rhythm Runner',
    description: 'Reach a 5x combo streak by collecting coins without getting hit.',
    iconName: 'Zap',
    rewardCoins: 75,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'combo_10',
    title: 'Diamond Paws',
    description: 'Achieve a legendary 10x combo multiplier.',
    iconName: 'Sparkles',
    rewardCoins: 200,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'double_jump_20',
    title: 'Acrobatic Hamster',
    description: 'Perform 20 double jumps.',
    iconName: 'ArrowUpCircle',
    rewardCoins: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 20,
  },
  {
    id: 'beat_level_1',
    title: 'Cage Breakout',
    description: 'Complete Level 1: Cozy Cage & Cedar Shavings.',
    iconName: 'Award',
    rewardCoins: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'beat_level_5',
    title: 'Cosmic Squeek',
    description: 'Conquer Level 5: Moonbase Hamster Orbit.',
    iconName: 'Trophy',
    rewardCoins: 300,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'CryptoHammy', score: 14250, distance: 3420, coins: 412, skinName: 'Diamond Paws' },
  { rank: 2, username: 'CheekStasher99', score: 11840, distance: 2890, coins: 334, skinName: 'Cyberpunk Squeek' },
  { rank: 3, username: 'HodlHamster', score: 9650, distance: 2310, coins: 280, skinName: 'Astro-Paws' },
  { rank: 4, username: 'WheelKing_Squeek', score: 7920, distance: 1950, coins: 215, skinName: 'Speedster Barnaby' },
  { rank: 5, username: 'SeedWhale_ETH', score: 6480, distance: 1620, coins: 180, skinName: 'Classic Syrian' },
  { rank: 6, username: 'MoonRunner42', score: 5120, distance: 1350, coins: 145, skinName: 'Astro-Paws' },
  { rank: 7, username: 'SqueekLord_Official', score: 3890, distance: 1040, coins: 110, skinName: 'Grand Squeek-Mage' },
];

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }

  return {
    totalRuns: 0,
    totalDistance: 0,
    totalCoins: 50, // Starting bonus for joining SqueekChain!
    highestScore: 0,
    highestCombo: 0,
    unlockedSkins: ['classic'],
    selectedSkin: 'classic',
    unlockedLevels: 1,
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
  };
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch {
    // Ignore error
  }
}

export function loadLevels(): LevelConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEVELS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return INITIAL_LEVELS;
}

export function saveLevels(levels: LevelConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LEVELS, JSON.stringify(levels));
  } catch {
    // Ignore error
  }
}

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return INITIAL_ACHIEVEMENTS;
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achievements));
  } catch {
    // Ignore error
  }
}

export function loadLeaderboard(playerScore?: number, playerDistance?: number, playerCoins?: number, skinName?: string): LeaderboardEntry[] {
  let list = [...INITIAL_LEADERBOARD];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }

  if (playerScore && playerScore > 0) {
    const playerEntry: LeaderboardEntry = {
      rank: 0,
      username: 'You (Squeek Runner)',
      score: playerScore,
      distance: playerDistance || 0,
      coins: playerCoins || 0,
      skinName: skinName || 'Classic Syrian',
      isPlayer: true,
    };

    // Remove old player entry if present
    list = list.filter(item => !item.isPlayer);
    list.push(playerEntry);
    list.sort((a, b) => b.score - a.score);

    // Re-assign ranks
    list = list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  return list;
}
