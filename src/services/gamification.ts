import { supabase } from '@/integrations/supabase/client';
import type { Tier } from '@/types';

// ============================================
// TIER SYSTEM
// ============================================

export interface TierInfo {
  tier: Tier;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  benefits: string[];
  xpMultiplier: number;
}

export const TIER_SYSTEM: Record<Tier, TierInfo> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 2999,
    color: '#CD7F32',
    icon: '🥉',
    benefits: ['Access to all subjects', 'Basic leaderboard'],
    xpMultiplier: 1.0,
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    minPoints: 3000,
    maxPoints: 7499,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: ['+10% XP bonus', 'Silver badge display'],
    xpMultiplier: 1.1,
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    minPoints: 7500,
    maxPoints: 14999,
    color: '#FFD700',
    icon: '🥇',
    benefits: ['+20% XP bonus', 'Exclusive gold badges', 'Priority matchmaking'],
    xpMultiplier: 1.2,
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum',
    minPoints: 15000,
    maxPoints: 29999,
    color: '#E5E4E2',
    icon: '💎',
    benefits: ['+30% XP bonus', 'Custom profile flair', 'Early access features'],
    xpMultiplier: 1.3,
  },
  diamond: {
    tier: 'diamond',
    name: 'Diamond',
    minPoints: 30000,
    maxPoints: 49999,
    color: '#B9F2FF',
    icon: '🔷',
    benefits: ['+50% XP bonus', 'Diamond-exclusive themes', 'Special animations'],
    xpMultiplier: 1.5,
  },
  champion: {
    tier: 'champion',
    name: 'Champion',
    minPoints: 50000,
    maxPoints: Infinity,
    color: '#FF6B35',
    icon: '👑',
    benefits: ['+100% XP bonus', 'Hall of Fame placement', 'Champion crown badge', 'All premium features'],
    xpMultiplier: 2.0,
  },
};

export function getTierInfo(points: number): TierInfo {
  if (points >= 50000) return TIER_SYSTEM.champion;
  if (points >= 30000) return TIER_SYSTEM.diamond;
  if (points >= 15000) return TIER_SYSTEM.platinum;
  if (points >= 7500) return TIER_SYSTEM.gold;
  if (points >= 3000) return TIER_SYSTEM.silver;
  return TIER_SYSTEM.bronze;
}

export function getNextTierInfo(currentPoints: number): { nextTier: TierInfo; pointsNeeded: number; progress: number } | null {
  const currentTier = getTierInfo(currentPoints);
  const tiers = Object.values(TIER_SYSTEM);
  const currentIndex = tiers.findIndex(t => t.tier === currentTier.tier);
  
  if (currentIndex >= tiers.length - 1) return null; // Already at champion
  
  const nextTier = tiers[currentIndex + 1];
  const pointsNeeded = nextTier.minPoints - currentPoints;
  const rangeSize = nextTier.minPoints - currentTier.minPoints;
  const progress = ((currentPoints - currentTier.minPoints) / rangeSize) * 100;
  
  return { nextTier, pointsNeeded, progress };
}

// ============================================
// TITLES SYSTEM
// ============================================

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'subject' | 'achievement' | 'special' | 'streak';
  subject?: string;
  requirement: {
    type: 'points' | 'streak' | 'quizzes' | 'accuracy' | 'special';
    value: number;
    subject?: string;
  };
}

export const TITLES: Title[] = [
  // Subject Titles - Mathematics
  { id: 'math-novice', name: 'Math Novice', description: 'Earned 500 points in Mathematics', icon: '🧮', category: 'subject', subject: 'mathematics', requirement: { type: 'points', value: 500, subject: 'mathematics' } },
  { id: 'math-whiz', name: 'Math Whiz', description: 'Earned 2000 points in Mathematics', icon: '📐', category: 'subject', subject: 'mathematics', requirement: { type: 'points', value: 2000, subject: 'mathematics' } },
  { id: 'math-champion', name: 'Math Champion', description: 'Earned 5000 points in Mathematics', icon: '🎯', category: 'subject', subject: 'mathematics', requirement: { type: 'points', value: 5000, subject: 'mathematics' } },
  { id: 'math-genius', name: 'Math Genius', description: 'Earned 10000 points in Mathematics', icon: '🧠', category: 'subject', subject: 'mathematics', requirement: { type: 'points', value: 10000, subject: 'mathematics' } },
  
  // Subject Titles - Chemistry
  { id: 'chem-learner', name: 'Chemistry Learner', description: 'Earned 500 points in Chemistry', icon: '🧪', category: 'subject', subject: 'chemistry', requirement: { type: 'points', value: 500, subject: 'chemistry' } },
  { id: 'chem-expert', name: 'Chemistry Expert', description: 'Earned 2000 points in Chemistry', icon: '⚗️', category: 'subject', subject: 'chemistry', requirement: { type: 'points', value: 2000, subject: 'chemistry' } },
  { id: 'chem-ace', name: 'Chemistry Ace', description: 'Earned 5000 points in Chemistry', icon: '🔬', category: 'subject', subject: 'chemistry', requirement: { type: 'points', value: 5000, subject: 'chemistry' } },
  
  // Subject Titles - Physics
  { id: 'physics-apprentice', name: 'Physics Apprentice', description: 'Earned 500 points in Physics', icon: '⚛️', category: 'subject', subject: 'physics', requirement: { type: 'points', value: 500, subject: 'physics' } },
  { id: 'physics-prodigy', name: 'Physics Prodigy', description: 'Earned 2000 points in Physics', icon: '🌌', category: 'subject', subject: 'physics', requirement: { type: 'points', value: 2000, subject: 'physics' } },
  { id: 'physics-master', name: 'Physics Master', description: 'Earned 5000 points in Physics', icon: '🚀', category: 'subject', subject: 'physics', requirement: { type: 'points', value: 5000, subject: 'physics' } },
  
  // Subject Titles - English
  { id: 'word-smith', name: 'Word Smith', description: 'Earned 500 points in English', icon: '📚', category: 'subject', subject: 'english', requirement: { type: 'points', value: 500, subject: 'english' } },
  { id: 'grammar-guru', name: 'Grammar Guru', description: 'Earned 2000 points in English', icon: '✍️', category: 'subject', subject: 'english', requirement: { type: 'points', value: 2000, subject: 'english' } },
  { id: 'language-legend', name: 'Language Legend', description: 'Earned 5000 points in English', icon: '🏆', category: 'subject', subject: 'english', requirement: { type: 'points', value: 5000, subject: 'english' } },
  
  // Achievement Titles
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete a quiz in under 30 seconds', icon: '⚡', category: 'achievement', requirement: { type: 'special', value: 1 } },
  { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', category: 'achievement', requirement: { type: 'special', value: 1 } },
  { id: 'early-bird', name: 'Early Bird', description: 'Study before 6 AM', icon: '🐦', category: 'achievement', requirement: { type: 'special', value: 1 } },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Score 100% on 10 quizzes', icon: '💯', category: 'achievement', requirement: { type: 'accuracy', value: 100 } },
  
  // Streak Titles
  { id: 'streak-starter', name: 'Streak Starter', description: '7-day login streak', icon: '🔥', category: 'streak', requirement: { type: 'streak', value: 7 } },
  { id: 'consistency-king', name: 'Consistency King', description: '30-day login streak', icon: '👑', category: 'streak', requirement: { type: 'streak', value: 30 } },
  { id: 'dedication-master', name: 'Dedication Master', description: '100-day login streak', icon: '💎', category: 'streak', requirement: { type: 'streak', value: 100 } },
  
  // Special Titles
  { id: 'beta-tester', name: 'Beta Tester', description: 'Joined during beta phase', icon: '🔬', category: 'special', requirement: { type: 'special', value: 1 } },
  { id: 'rankme-legend', name: 'RankMe Legend', description: 'Reached Champion tier', icon: '🏆', category: 'special', requirement: { type: 'points', value: 50000 } },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Complete 100 quizzes', icon: '📖', category: 'achievement', requirement: { type: 'quizzes', value: 100 } },
];

// ============================================
// BADGES SYSTEM
// ============================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'study' | 'time' | 'streak' | 'subject' | 'social' | 'special';
}

export const BADGES: Badge[] = [
  // Study Badges
  { id: 'first-quiz', name: 'First Quiz', description: 'Complete your first quiz', icon: '🎯', rarity: 'common', category: 'study' },
  { id: 'perfect-score', name: 'Perfect Score', description: 'Score 100% on any quiz', icon: '💯', rarity: 'uncommon', category: 'study' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete quiz in under 30 seconds', icon: '⚡', rarity: 'rare', category: 'study' },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Complete 100+ quizzes', icon: '📖', rarity: 'epic', category: 'study' },
  { id: 'knowledge-seeker', name: 'Knowledge Seeker', description: 'Complete 500+ quizzes', icon: '🧠', rarity: 'legendary', category: 'study' },
  
  // Time Badges
  { id: 'night-owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', rarity: 'uncommon', category: 'time' },
  { id: 'early-bird', name: 'Early Bird', description: 'Study before 6 AM', icon: '🐦', rarity: 'rare', category: 'time' },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: 'Study on weekends', icon: '🏋️', rarity: 'uncommon', category: 'time' },
  
  // Streak Badges
  { id: 'three-day-streak', name: '3-Day Streak', description: '3 consecutive days', icon: '🔥', rarity: 'common', category: 'streak' },
  { id: 'weekly-warrior', name: 'Weekly Warrior', description: '7-day study streak', icon: '📅', rarity: 'uncommon', category: 'streak' },
  { id: 'fortnight-champ', name: 'Fortnight Champ', description: '14-day study streak', icon: '⚔️', rarity: 'rare', category: 'streak' },
  { id: 'monthly-master', name: 'Monthly Master', description: '30-day study streak', icon: '📆', rarity: 'epic', category: 'streak' },
  { id: 'streak-legend', name: 'Streak Legend', description: '60-day study streak', icon: '🌟', rarity: 'legendary', category: 'streak' },
  { id: 'century-club', name: 'Century Club', description: '100-day study streak', icon: '💎', rarity: 'mythic', category: 'streak' },
  
  // Subject Badges
  { id: 'math-wizard', name: 'Math Wizard', description: 'Master 50 math topics', icon: '🧙‍♂️', rarity: 'rare', category: 'subject' },
  { id: 'science-ace', name: 'Science Ace', description: 'Master 50 science topics', icon: '🔬', rarity: 'rare', category: 'subject' },
  { id: 'english-expert', name: 'English Expert', description: 'Master 50 English topics', icon: '📚', rarity: 'rare', category: 'subject' },
  { id: 'all-rounder', name: 'All-Rounder', description: 'Complete quizzes in all subjects', icon: '🌍', rarity: 'epic', category: 'subject' },
  
  // Social Badges
  { id: 'friendly-rival', name: 'Friendly Rival', description: 'Challenge 10 friends', icon: '🤝', rarity: 'uncommon', category: 'social' },
  { id: 'helping-hand', name: 'Helping Hand', description: 'Help 5 friends', icon: '🙏', rarity: 'rare', category: 'social' },
  { id: 'popular', name: 'Popular', description: 'Have 50+ friends', icon: '⭐', rarity: 'epic', category: 'social' },
  { id: 'battle-champion', name: 'Battle Champion', description: 'Win 50 PvP battles', icon: '🏅', rarity: 'legendary', category: 'social' },
  
  // Special Badges
  { id: 'beta-tester', name: 'Beta Tester', description: 'Joined during beta', icon: '🔬', rarity: 'legendary', category: 'special' },
  { id: 'champion', name: 'Champion', description: 'Reached Champion tier', icon: '🏆', rarity: 'mythic', category: 'special' },
  { id: 'lucky-finder', name: 'Lucky Finder', description: 'Found rare mystery box', icon: '🍀', rarity: 'rare', category: 'special' },
  { id: 'box-opener', name: 'Box Opener', description: 'Opened 50 mystery boxes', icon: '🎁', rarity: 'epic', category: 'special' },
];

export const RARITY_COLORS: Record<Badge['rarity'], string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EF4444',
};

// ============================================
// DAILY REWARDS & MYSTERY BOX
// ============================================

export interface DailyReward {
  day: number;
  reward: {
    type: 'points' | 'xpBoost' | 'badge' | 'theme';
    value: number | string;
    multiplier?: number;
    duration?: number;
  };
  icon: string;
  isSpecial: boolean;
}

export const WEEKLY_REWARDS: DailyReward[] = [
  { day: 1, reward: { type: 'points', value: 50 }, icon: '⭐', isSpecial: false },
  { day: 2, reward: { type: 'points', value: 75 }, icon: '⭐', isSpecial: false },
  { day: 3, reward: { type: 'xpBoost', value: 1.25, multiplier: 1.25, duration: 3600 }, icon: '⚡', isSpecial: true },
  { day: 4, reward: { type: 'points', value: 100 }, icon: '⭐', isSpecial: false },
  { day: 5, reward: { type: 'points', value: 125 }, icon: '⭐', isSpecial: false },
  { day: 6, reward: { type: 'xpBoost', value: 1.5, multiplier: 1.5, duration: 7200 }, icon: '⚡', isSpecial: true },
  { day: 7, reward: { type: 'points', value: 500 }, icon: '🎁', isSpecial: true },
];

export interface MysteryBoxReward {
  type: 'points' | 'xpBoost' | 'badge' | 'title';
  value: number | string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number; // Higher = more common
}

export const MYSTERY_BOX_REWARDS: MysteryBoxReward[] = [
  { type: 'points', value: 50, rarity: 'common', weight: 40 },
  { type: 'points', value: 100, rarity: 'uncommon', weight: 25 },
  { type: 'points', value: 250, rarity: 'rare', weight: 15 },
  { type: 'points', value: 500, rarity: 'epic', weight: 8 },
  { type: 'points', value: 1000, rarity: 'legendary', weight: 2 },
  { type: 'xpBoost', value: 1.25, rarity: 'uncommon', weight: 5 },
  { type: 'xpBoost', value: 1.5, rarity: 'rare', weight: 3 },
  { type: 'xpBoost', value: 2.0, rarity: 'legendary', weight: 1 },
  { type: 'badge', value: 'lucky-finder', rarity: 'rare', weight: 1 },
];

export function rollMysteryBox(): MysteryBoxReward {
  const totalWeight = MYSTERY_BOX_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const reward of MYSTERY_BOX_REWARDS) {
    random -= reward.weight;
    if (random <= 0) {
      return reward;
    }
  }
  
  return MYSTERY_BOX_REWARDS[0]; // Fallback
}

// ============================================
// XP BOOSTER SYSTEM
// ============================================

export interface XPBooster {
  id: string;
  multiplier: number;
  expiresAt: Date;
  source: string;
}

export function isBoosterActive(booster: XPBooster): boolean {
  return new Date() < booster.expiresAt;
}

export function calculateBoostedXP(baseXP: number, boosters: XPBooster[]): number {
  const activeBoosters = boosters.filter(isBoosterActive);
  const totalMultiplier = activeBoosters.reduce((mult, b) => mult * b.multiplier, 1);
  return Math.round(baseXP * totalMultiplier);
}

// ============================================
// ACHIEVEMENTS TRACKING
// ============================================

export async function checkAchievements(userId: string, action: string, data: Record<string, unknown>): Promise<Badge[]> {
  const unlocked: Badge[] = [];
  
  // Time-based achievements
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 4) {
    // Night owl badge potential
    const nightOwlBadge = BADGES.find(b => b.id === 'night-owl');
    if (nightOwlBadge) unlocked.push(nightOwlBadge);
  }
  
  if (hour >= 4 && hour < 6) {
    const earlyBirdBadge = BADGES.find(b => b.id === 'early-bird');
    if (earlyBirdBadge) unlocked.push(earlyBirdBadge);
  }
  
  // Quiz completion achievements
  if (action === 'quiz_complete') {
    const firstQuizBadge = BADGES.find(b => b.id === 'first-quiz');
    if (firstQuizBadge && data.isFirst) unlocked.push(firstQuizBadge);
    
    if ((data.accuracy as number) === 100) {
      const perfectBadge = BADGES.find(b => b.id === 'perfect-score');
      if (perfectBadge) unlocked.push(perfectBadge);
    }
    
    if ((data.time as number) < 30000) {
      const speedBadge = BADGES.find(b => b.id === 'speed-demon');
      if (speedBadge) unlocked.push(speedBadge);
    }
  }
  
  return unlocked;
}
