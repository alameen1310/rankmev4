import { RARITY_COLORS } from './gamification';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type ChallengeType = 'streak' | 'quiz' | 'accuracy' | 'speed' | 'social' | 'subject' | 'time' | 'quantity';

export interface ChallengeBadge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  difficulty: ChallengeDifficulty;
  challenge: {
    type: ChallengeType;
    description: string;
    requirement: number;
    unit?: string;
  };
  reward: {
    points: number;
    specialEffect?: string;
  };
}

export const CHALLENGE_BADGES: ChallengeBadge[] = [
  // EASY CHALLENGES
  {
    id: 'first-steps',
    name: 'First Steps',
    icon: '👣',
    rarity: 'common',
    difficulty: 'easy',
    challenge: {
      type: 'streak',
      description: 'Maintain a 3-day login streak',
      requirement: 3,
      unit: 'days',
    },
    reward: { points: 100 },
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    icon: '📚',
    rarity: 'common',
    difficulty: 'easy',
    challenge: {
      type: 'quiz',
      description: 'Complete 10 quizzes',
      requirement: 10,
      unit: 'quizzes',
    },
    reward: { points: 150 },
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    icon: '🦋',
    rarity: 'common',
    difficulty: 'easy',
    challenge: {
      type: 'social',
      description: 'Add 5 friends',
      requirement: 5,
      unit: 'friends',
    },
    reward: { points: 100 },
  },
  {
    id: 'sharp-shooter',
    name: 'Sharp Shooter',
    icon: '🎯',
    rarity: 'common',
    difficulty: 'easy',
    challenge: {
      type: 'accuracy',
      description: 'Score 80%+ on 5 quizzes',
      requirement: 5,
      unit: 'quizzes',
    },
    reward: { points: 120 },
  },

  // MEDIUM CHALLENGES
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    icon: '🏋️',
    rarity: 'uncommon',
    difficulty: 'medium',
    challenge: {
      type: 'time',
      description: 'Study on 4 weekends in a row',
      requirement: 4,
      unit: 'weekends',
    },
    reward: { points: 300 },
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    icon: '💯',
    rarity: 'uncommon',
    difficulty: 'medium',
    challenge: {
      type: 'accuracy',
      description: 'Score 100% on 5 different quizzes',
      requirement: 5,
      unit: 'perfect scores',
    },
    reward: { points: 400 },
  },
  {
    id: 'subject-specialist',
    name: 'Subject Specialist',
    icon: '🎓',
    rarity: 'uncommon',
    difficulty: 'medium',
    challenge: {
      type: 'subject',
      description: 'Complete 20 quizzes in one subject',
      requirement: 20,
      unit: 'quizzes',
    },
    reward: { points: 350 },
  },
  {
    id: 'quiz-enthusiast',
    name: 'Quiz Enthusiast',
    icon: '🤓',
    rarity: 'uncommon',
    difficulty: 'medium',
    challenge: {
      type: 'quantity',
      description: 'Complete 50 quizzes total',
      requirement: 50,
      unit: 'quizzes',
    },
    reward: { points: 500 },
  },

  // HARD CHALLENGES
  {
    id: 'streak-master',
    name: 'Streak Master',
    icon: '🔥',
    rarity: 'rare',
    difficulty: 'hard',
    challenge: {
      type: 'streak',
      description: 'Maintain a 30-day login streak',
      requirement: 30,
      unit: 'days',
    },
    reward: { points: 1000, specialEffect: 'Fire badge glow' },
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    icon: '⚡',
    rarity: 'rare',
    difficulty: 'hard',
    challenge: {
      type: 'speed',
      description: 'Complete a quiz in under 30 seconds with 90%+ accuracy',
      requirement: 1,
      unit: 'quiz',
    },
    reward: { points: 800 },
  },
  {
    id: 'battle-veteran',
    name: 'Battle Veteran',
    icon: '⚔️',
    rarity: 'rare',
    difficulty: 'hard',
    challenge: {
      type: 'social',
      description: 'Win 25 PvP battles',
      requirement: 25,
      unit: 'victories',
    },
    reward: { points: 1200 },
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    icon: '🌍',
    rarity: 'epic',
    difficulty: 'hard',
    challenge: {
      type: 'subject',
      description: 'Complete 10 quizzes in every subject',
      requirement: 10,
      unit: 'per subject',
    },
    reward: { points: 2000, specialEffect: 'Rainbow badge border' },
  },

  // EXTREME CHALLENGES
  {
    id: 'immortal-streak',
    name: 'Immortal Streak',
    icon: '♾️',
    rarity: 'legendary',
    difficulty: 'extreme',
    challenge: {
      type: 'streak',
      description: 'Maintain a 100-day login streak',
      requirement: 100,
      unit: 'days',
    },
    reward: { points: 5000, specialEffect: 'Golden pulsing aura' },
  },
  {
    id: 'perfect-year',
    name: 'Perfect Year',
    icon: '🌟',
    rarity: 'mythic',
    difficulty: 'extreme',
    challenge: {
      type: 'streak',
      description: 'Study every day for a full year',
      requirement: 365,
      unit: 'days',
    },
    reward: { points: 25000, specialEffect: 'Exclusive celestial theme' },
  },
  {
    id: 'champion-of-all',
    name: 'Champion of All',
    icon: '👑',
    rarity: 'mythic',
    difficulty: 'extreme',
    challenge: {
      type: 'subject',
      description: 'Reach #1 rank in every subject leaderboard',
      requirement: 1,
      unit: 'rank',
    },
    reward: { points: 50000, specialEffect: 'Permanent Hall of Fame' },
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    icon: '📖',
    rarity: 'epic',
    difficulty: 'extreme',
    challenge: {
      type: 'quantity',
      description: 'Complete 1000 quizzes',
      requirement: 1000,
      unit: 'quizzes',
    },
    reward: { points: 10000, specialEffect: 'Special title unlock' },
  },
];

// Mystery Box Exclusive Badges
export const MYSTERY_BOX_EXCLUSIVES: ChallengeBadge[] = [
  {
    id: 'golden-ticket',
    name: 'Golden Ticket',
    icon: '🎫',
    rarity: 'mythic',
    difficulty: 'extreme',
    challenge: {
      type: 'quantity',
      description: 'Ultra rare mystery box drop (0.1% chance)',
      requirement: 1,
    },
    reward: { points: 5000, specialEffect: 'Permanent +5% XP boost' },
  },
  {
    id: 'lucky-charm',
    name: 'Lucky Charm',
    icon: '🍀',
    rarity: 'legendary',
    difficulty: 'hard',
    challenge: {
      type: 'quantity',
      description: 'Rare mystery box drop (0.5% chance)',
      requirement: 1,
    },
    reward: { points: 2000, specialEffect: 'Double mystery box rewards for 24h' },
  },
  {
    id: 'void-walker',
    name: 'Void Walker',
    icon: '🌌',
    rarity: 'mythic',
    difficulty: 'extreme',
    challenge: {
      type: 'quantity',
      description: 'Only 100 players can have this badge',
      requirement: 1,
    },
    reward: { points: 10000, specialEffect: 'Exclusive void theme + effects' },
  },
];

// Difficulty colors and icons
export const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { color: string; icon: string; label: string }> = {
  easy: { color: '#22C55E', icon: '⭐', label: 'Easy' },
  medium: { color: '#F59E0B', icon: '⭐⭐', label: 'Medium' },
  hard: { color: '#EF4444', icon: '⭐⭐⭐', label: 'Hard' },
  extreme: { color: '#9333EA', icon: '💀', label: 'Extreme' },
};

// Get challenge progress from localStorage (simplified - would normally be from database)
export function getChallengeProgress(badgeId: string): number {
  const saved = localStorage.getItem(`challenge_progress_${badgeId}`);
  return saved ? parseInt(saved, 10) : 0;
}

export function updateChallengeProgress(badgeId: string, progress: number): void {
  localStorage.setItem(`challenge_progress_${badgeId}`, progress.toString());
}

// Check if challenge is completed
export function isChallengeCompleted(badge: ChallengeBadge): boolean {
  const progress = getChallengeProgress(badge.id);
  return progress >= badge.challenge.requirement;
}

// Get all challenges filtered by difficulty
export function getChallengesByDifficulty(difficulty: ChallengeDifficulty | 'all'): ChallengeBadge[] {
  if (difficulty === 'all') return CHALLENGE_BADGES;
  return CHALLENGE_BADGES.filter(b => b.difficulty === difficulty);
}
