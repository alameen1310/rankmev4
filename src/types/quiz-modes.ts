// Quiz Mode Types - Separating XP (casual) from Rank (competitive)

export type QuizModeType = 
  | 'quick-play'    // XP-only, subject selection, 10 Qs, 30s each
  | 'focus-drill'   // XP-only, topic selection, accuracy-focused
  | 'time-attack'   // XP-only, global timer, combo multipliers
  | 'survival';     // XP-only, one wrong = elimination

export type PvPModeType = 
  | 'casual-duel'   // XP-only, friendly competition
  | 'ranked-duel'   // Rank-only, MMR-based
  | 'race-mode';    // XP-only, first to answer wins

export type RewardType = 'xp' | 'rank';

export interface QuizModeConfig {
  id: QuizModeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  rewardType: RewardType;
  allowSubjectSelection: boolean;
  allowTopicSelection: boolean;
  allowDifficultySelection: boolean;
  questionCount: number | { min: number; max: number };
  timePerQuestion: number | null; // null = no per-question timer
  globalTimer: number | null;     // null = no global timer
  features: string[];
}

export interface PvPModeConfig {
  id: PvPModeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  rewardType: RewardType;
  allowSubjectSelection: boolean;
  questionCount: number;
  timePerQuestion: number;
  dailyLimit: number | null;
  features: string[];
}

// Solo Quiz Mode Configurations
export const QUIZ_MODES: Record<QuizModeType, QuizModeConfig> = {
  'quick-play': {
    id: 'quick-play',
    name: 'Quick Play',
    description: 'Classic 10-question quiz with subject selection',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    rewardType: 'xp',
    allowSubjectSelection: true,
    allowTopicSelection: false,
    allowDifficultySelection: false,
    questionCount: 10,
    timePerQuestion: 30,
    globalTimer: null,
    features: ['Subject selection', 'Mixed difficulty', 'Speed bonus XP', 'Streak tracking'],
  },
  'focus-drill': {
    id: 'focus-drill',
    name: 'Focus Drill',
    description: 'Deep practice with topic & difficulty control',
    icon: '🎯',
    color: 'from-emerald-500 to-green-500',
    rewardType: 'xp',
    allowSubjectSelection: true,
    allowTopicSelection: true,
    allowDifficultySelection: true,
    questionCount: { min: 5, max: 15 },
    timePerQuestion: null, // No timer - focus on accuracy
    globalTimer: null,
    features: ['Topic mastery tracking', 'Accuracy-focused', 'Weak area insights', 'No time pressure'],
  },
  'time-attack': {
    id: 'time-attack',
    name: 'Time Attack',
    description: 'Race against the clock! Combo multipliers for streaks',
    icon: '🔥',
    color: 'from-orange-500 to-red-500',
    rewardType: 'xp',
    allowSubjectSelection: true,
    allowTopicSelection: false,
    allowDifficultySelection: false,
    questionCount: 999, // Unlimited until timer ends
    timePerQuestion: null,
    globalTimer: 120, // 2 minutes
    features: ['Global 2-min timer', 'Combo multipliers', 'Speed is key', 'High score tracking'],
  },
  'survival': {
    id: 'survival',
    name: 'Survival',
    description: 'One wrong answer and you\'re out! How far can you go?',
    icon: '💀',
    color: 'from-purple-500 to-pink-500',
    rewardType: 'xp',
    allowSubjectSelection: true,
    allowTopicSelection: false,
    allowDifficultySelection: false,
    questionCount: 999, // Unlimited until elimination
    timePerQuestion: 20, // Faster timer
    globalTimer: null,
    features: ['Increasing difficulty', 'One life only', 'Shareable rounds', 'High tension'],
  },
};

// PvP Mode Configurations
export const PVP_MODES: Record<PvPModeType, PvPModeConfig> = {
  'casual-duel': {
    id: 'casual-duel',
    name: 'Casual Duel',
    description: 'Friendly 1v1 battle - no rank impact',
    icon: '🤝',
    color: 'from-blue-500 to-indigo-500',
    rewardType: 'xp',
    allowSubjectSelection: true,
    questionCount: 5,
    timePerQuestion: 20,
    dailyLimit: null,
    features: ['Subject selection', 'XP rewards', 'Practice against friends', 'No rank at stake'],
  },
  'ranked-duel': {
    id: 'ranked-duel',
    name: 'Ranked Duel',
    description: 'Competitive 1v1 - climb the leaderboard!',
    icon: '⚔️',
    color: 'from-yellow-500 to-orange-500',
    rewardType: 'rank',
    allowSubjectSelection: false, // System selects mixed subjects
    questionCount: 5,
    timePerQuestion: 15,
    dailyLimit: 3, // Max 3 ranked matches per day
    features: ['Mixed subjects', 'MMR-based matching', 'Rank points', 'Daily limit: 3'],
  },
  'race-mode': {
    id: 'race-mode',
    name: 'Race Mode',
    description: 'First to answer correctly scores! Speed is everything',
    icon: '🏎️',
    color: 'from-cyan-500 to-blue-500',
    rewardType: 'xp',
    allowSubjectSelection: false,
    questionCount: 10,
    timePerQuestion: 30,
    dailyLimit: null,
    features: ['Same question shown', 'First correct wins point', 'Wrong = lockout', 'Pure speed'],
  },
};

// XP Calculation formulas
export interface XPCalculationInput {
  mode: QuizModeType;
  correctAnswers: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  comboMultiplier?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  roundsSurvived?: number;
}

export function calculateXP(input: XPCalculationInput): number {
  const { mode, correctAnswers, totalQuestions, averageTimePerQuestion, comboMultiplier = 1, difficulty = 'medium', roundsSurvived = 0 } = input;
  
  const baseXP = correctAnswers * 10; // 10 XP per correct answer
  const accuracyBonus = totalQuestions > 0 ? Math.floor((correctAnswers / totalQuestions) * 50) : 0;
  
  switch (mode) {
    case 'quick-play': {
      // Speed bonus: faster = more XP (max 30% bonus)
      const speedBonus = Math.max(0, Math.floor((30 - averageTimePerQuestion) / 30 * baseXP * 0.3));
      return Math.floor((baseXP + accuracyBonus + speedBonus) * comboMultiplier);
    }
    
    case 'focus-drill': {
      // Accuracy is king - no speed bonus
      const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1;
      return Math.floor((baseXP + accuracyBonus * 2) * difficultyMultiplier);
    }
    
    case 'time-attack': {
      // Combo multiplier is crucial
      return Math.floor((baseXP * comboMultiplier) + (correctAnswers * 5)); // Bonus per question answered
    }
    
    case 'survival': {
      // Rounds survived matters most
      const survivalBonus = roundsSurvived * 15; // 15 XP per round survived
      const difficultyBonus = Math.floor(roundsSurvived / 3) * 10; // Bonus every 3 rounds
      return baseXP + survivalBonus + difficultyBonus;
    }
    
    default:
      return baseXP;
  }
}

// Rank/MMR calculation for Ranked Duel
export interface RankCalculationInput {
  playerMMR: number;
  opponentMMR: number;
  won: boolean;
  playerScore: number;
  opponentScore: number;
}

export function calculateRankChange(input: RankCalculationInput): number {
  const { playerMMR, opponentMMR, won, playerScore, opponentScore } = input;
  
  const K = 32; // Standard ELO K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  const actualScore = won ? 1 : 0;
  
  let change = Math.round(K * (actualScore - expectedScore));
  
  // Performance adjustment based on score difference
  const scoreDiff = playerScore - opponentScore;
  const performanceBonus = Math.floor(scoreDiff / 50); // ±1 point per 50 score difference
  change += performanceBonus;
  
  // Minimum change of ±5 to prevent stagnation
  if (change > 0 && change < 5) change = 5;
  if (change < 0 && change > -5) change = -5;
  
  return change;
}

// Anti-abuse: Diminishing returns tracking
export interface DailyPlayStats {
  quickPlayCount: number;
  focusDrillCount: number;
  timeAttackCount: number;
  survivalCount: number;
  topicsPlayedToday: string[];
  lastPlayedAt: string;
}

export function getDiminishingMultiplier(playCount: number): number {
  // First 3 plays: full XP
  // 4-6 plays: 75% XP
  // 7-10 plays: 50% XP
  // 11+: 25% XP
  if (playCount <= 3) return 1;
  if (playCount <= 6) return 0.75;
  if (playCount <= 10) return 0.5;
  return 0.25;
}

// Survival mode difficulty scaling
export function getSurvivalDifficulty(round: number): 'easy' | 'medium' | 'hard' {
  if (round <= 3) return 'easy';
  if (round <= 7) return 'medium';
  return 'hard';
}

// Time Attack combo system
export interface ComboState {
  currentStreak: number;
  multiplier: number;
  maxStreak: number;
}

export function getComboMultiplier(streak: number): number {
  // 0-2: 1x, 3-5: 1.5x, 6-9: 2x, 10+: 2.5x (max)
  if (streak < 3) return 1;
  if (streak < 6) return 1.5;
  if (streak < 10) return 2;
  return 2.5;
}
