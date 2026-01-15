/**
 * Centralized Tracking Service
 * Manages streak, points, rank, and badges with cross-component synchronization
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tier } from '@/types';

// ============= Types =============
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  quizStreak: number;
  lastQuizDate: string | null;
}

interface PointsData {
  total: number;
  weekly: number;
  today: number;
  bySubject: Record<string, number>;
}

interface RankData {
  tier: Tier;
  globalRank: number | null;
  percentile: number | null;
}

interface TrackingState {
  streak: StreakData;
  points: PointsData;
  rank: RankData;
  showcaseBadges: string[];
  equippedTitle: string | null;
  lastSync: number;
}

// ============= Storage Keys =============
const STORAGE_KEYS = {
  STATE: 'rankme_tracking_state',
  TRANSACTIONS: 'rankme_recent_transactions',
  QUIZ_COMPLETIONS: 'rankme_quiz_completions',
  SHOWCASE_BADGES: 'rankme_showcase_badges',
  EQUIPPED_TITLE: 'rankme_equipped_title',
} as const;

// ============= Events =============
export const TRACKING_EVENTS = {
  STREAK_UPDATED: 'tracking:streak-updated',
  POINTS_UPDATED: 'tracking:points-updated',
  RANK_UPDATED: 'tracking:rank-updated',
  BADGES_UPDATED: 'tracking:badges-updated',
  TITLE_UPDATED: 'tracking:title-updated',
  STATE_SYNCED: 'tracking:state-synced',
} as const;

// ============= Tier System =============
const TIER_THRESHOLDS: { tier: Tier; min: number; max: number }[] = [
  { tier: 'bronze', min: 0, max: 2999 },
  { tier: 'silver', min: 3000, max: 7499 },
  { tier: 'gold', min: 7500, max: 14999 },
  { tier: 'platinum', min: 15000, max: 29999 },
  { tier: 'diamond', min: 30000, max: 49999 },
  { tier: 'champion', min: 50000, max: Infinity },
];

// ============= Default State =============
const getDefaultState = (): TrackingState => ({
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    quizStreak: 0,
    lastQuizDate: null,
  },
  points: {
    total: 0,
    weekly: 0,
    today: 0,
    bySubject: {},
  },
  rank: {
    tier: 'bronze',
    globalRank: null,
    percentile: null,
  },
  showcaseBadges: [],
  equippedTitle: null,
  lastSync: 0,
});

// ============= Tracking Service Class =============
class TrackingService {
  private state: TrackingState;
  private userId: string | null = null;

  constructor() {
    this.state = this.loadState();
  }

  // ============= Initialization =============
  private loadState(): TrackingState {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATE);
      if (saved) {
        return { ...getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading tracking state:', e);
    }
    return getDefaultState();
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving tracking state:', e);
    }
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  // ============= State Getters =============
  getState(): TrackingState {
    return { ...this.state };
  }

  getStreakData(): StreakData {
    return { ...this.state.streak };
  }

  getPointsData(): PointsData {
    return { ...this.state.points };
  }

  getRankData(): RankData {
    return { ...this.state.rank };
  }

  getShowcaseBadges(): string[] {
    return [...this.state.showcaseBadges];
  }

  getEquippedTitle(): string | null {
    return this.state.equippedTitle;
  }

  // ============= Sync with Profile =============
  syncWithProfile(profile: {
    current_streak: number;
    longest_streak: number;
    total_points: number;
    weekly_points: number;
    tier: Tier;
  }): void {
    this.state.streak.currentStreak = profile.current_streak;
    this.state.streak.longestStreak = profile.longest_streak;
    this.state.points.total = profile.total_points;
    this.state.points.weekly = profile.weekly_points;
    this.state.rank.tier = profile.tier;
    this.state.lastSync = Date.now();
    
    this.saveState();
    this.broadcast(TRACKING_EVENTS.STATE_SYNCED, this.state);
  }

  // ============= Streak Management =============
  async updateStreak(type: 'login' | 'quiz' = 'login'): Promise<{
    newStreak: number;
    streakType: 'first' | 'continued' | 'broken' | 'already';
    isMilestone: boolean;
  }> {
    const today = new Date().toDateString();
    
    if (type === 'login') {
      return this.updateLoginStreak(today);
    } else {
      return this.updateQuizStreak(today);
    }
  }

  private updateLoginStreak(today: string): {
    newStreak: number;
    streakType: 'first' | 'continued' | 'broken' | 'already';
    isMilestone: boolean;
  } {
    const { lastActiveDate, currentStreak } = this.state.streak;
    
    // First time
    if (!lastActiveDate) {
      this.state.streak.currentStreak = 1;
      this.state.streak.lastActiveDate = today;
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      return { newStreak: 1, streakType: 'first', isMilestone: true };
    }

    // Already logged in today
    if (lastActiveDate === today) {
      return { newStreak: currentStreak, streakType: 'already', isMilestone: false };
    }

    // Calculate yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastActiveDate === yesterdayStr) {
      // Consecutive day
      const newStreak = currentStreak + 1;
      this.state.streak.currentStreak = newStreak;
      this.state.streak.longestStreak = Math.max(this.state.streak.longestStreak, newStreak);
      this.state.streak.lastActiveDate = today;
      
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      
      return { 
        newStreak, 
        streakType: 'continued', 
        isMilestone: this.isStreakMilestone(newStreak),
      };
    } else {
      // Streak broken
      this.state.streak.currentStreak = 1;
      this.state.streak.lastActiveDate = today;
      
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      
      return { newStreak: 1, streakType: 'broken', isMilestone: false };
    }
  }

  private updateQuizStreak(today: string): {
    newStreak: number;
    streakType: 'first' | 'continued' | 'broken' | 'already';
    isMilestone: boolean;
  } {
    const { lastQuizDate, quizStreak } = this.state.streak;
    
    if (!lastQuizDate) {
      this.state.streak.quizStreak = 1;
      this.state.streak.lastQuizDate = today;
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      return { newStreak: 1, streakType: 'first', isMilestone: true };
    }

    if (lastQuizDate === today) {
      return { newStreak: quizStreak, streakType: 'already', isMilestone: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastQuizDate === yesterdayStr) {
      const newStreak = quizStreak + 1;
      this.state.streak.quizStreak = newStreak;
      this.state.streak.lastQuizDate = today;
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      return { newStreak, streakType: 'continued', isMilestone: this.isStreakMilestone(newStreak) };
    } else {
      this.state.streak.quizStreak = 1;
      this.state.streak.lastQuizDate = today;
      this.saveState();
      this.broadcast(TRACKING_EVENTS.STREAK_UPDATED, this.state.streak);
      return { newStreak: 1, streakType: 'broken', isMilestone: false };
    }
  }

  private isStreakMilestone(streak: number): boolean {
    return [3, 7, 14, 30, 60, 100].includes(streak);
  }

  // ============= Points Management =============
  addPoints(amount: number, source: string, subject: string = 'general'): boolean {
    if (amount <= 0) return false;
    
    // Check for duplicate transactions
    if (this.isDuplicateTransaction(source, subject)) {
      console.warn('Duplicate points transaction prevented');
      return false;
    }

    // Update points
    this.state.points.total += amount;
    this.state.points.today += amount;
    this.state.points.weekly += amount;
    
    // Update subject breakdown
    if (!this.state.points.bySubject[subject]) {
      this.state.points.bySubject[subject] = 0;
    }
    this.state.points.bySubject[subject] += amount;

    // Update tier
    this.updateTier();
    
    // Record transaction
    this.recordTransaction(source, subject, amount);
    
    this.saveState();
    this.broadcast(TRACKING_EVENTS.POINTS_UPDATED, this.state.points);
    
    return true;
  }

  private isDuplicateTransaction(source: string, subject: string): boolean {
    try {
      const transactions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'
      );
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      return transactions.some((t: { source: string; subject: string; timestamp: number }) =>
        t.source === source && 
        t.subject === subject && 
        t.timestamp > fiveMinutesAgo
      );
    } catch {
      return false;
    }
  }

  private recordTransaction(source: string, subject: string, amount: number): void {
    try {
      const transactions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'
      );
      transactions.push({ source, subject, amount, timestamp: Date.now() });
      localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS, 
        JSON.stringify(transactions.slice(-20))
      );
    } catch (e) {
      console.error('Error recording transaction:', e);
    }
  }

  // ============= Rank & Tier Management =============
  private updateTier(): void {
    const tier = TIER_THRESHOLDS.find(
      t => this.state.points.total >= t.min && this.state.points.total <= t.max
    );
    
    if (tier && tier.tier !== this.state.rank.tier) {
      const oldTier = this.state.rank.tier;
      this.state.rank.tier = tier.tier;
      this.broadcast(TRACKING_EVENTS.RANK_UPDATED, { 
        ...this.state.rank, 
        tierUpgrade: { from: oldTier, to: tier.tier } 
      });
    }
  }

  updateRank(rank: number, percentile: number): void {
    this.state.rank.globalRank = rank;
    this.state.rank.percentile = percentile;
    this.saveState();
    this.broadcast(TRACKING_EVENTS.RANK_UPDATED, this.state.rank);
  }

  // ============= Quiz Completion Tracking =============
  canAwardQuizPoints(quizId: string): boolean {
    try {
      const completions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.QUIZ_COMPLETIONS) || '[]'
      );
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      return !completions.some((c: { quizId: string; timestamp: number }) =>
        c.quizId === quizId && c.timestamp > oneDayAgo
      );
    } catch {
      return true;
    }
  }

  recordQuizCompletion(quizId: string, score: number, points: number, subject: string): void {
    try {
      const completions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.QUIZ_COMPLETIONS) || '[]'
      );
      completions.push({ quizId, score, points, subject, timestamp: Date.now() });
      localStorage.setItem(
        STORAGE_KEYS.QUIZ_COMPLETIONS, 
        JSON.stringify(completions.slice(-50))
      );
    } catch (e) {
      console.error('Error recording quiz completion:', e);
    }
  }

  // ============= Badge Showcase Management =============
  async setShowcaseBadges(badges: string[]): Promise<void> {
    this.state.showcaseBadges = badges.slice(0, 3);
    localStorage.setItem(STORAGE_KEYS.SHOWCASE_BADGES, JSON.stringify(this.state.showcaseBadges));
    this.saveState();
    this.broadcast(TRACKING_EVENTS.BADGES_UPDATED, this.state.showcaseBadges);
    
    // Sync with database
    if (this.userId) {
      try {
        await supabase
          .from('profiles')
          .update({ showcase_badges: this.state.showcaseBadges })
          .eq('id', this.userId);
      } catch (e) {
        console.error('Error syncing showcase badges to database:', e);
      }
    }
  }

  // ============= Title Management =============
  async setEquippedTitle(title: string | null): Promise<void> {
    this.state.equippedTitle = title;
    localStorage.setItem(STORAGE_KEYS.EQUIPPED_TITLE, title || '');
    this.saveState();
    this.broadcast(TRACKING_EVENTS.TITLE_UPDATED, title);
    
    // Sync with database
    if (this.userId) {
      try {
        await supabase
          .from('profiles')
          .update({ equipped_title: title })
          .eq('id', this.userId);
      } catch (e) {
        console.error('Error syncing equipped title to database:', e);
      }
    }
  }

  // ============= Event Broadcasting =============
  private broadcast(event: string, data: unknown): void {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  // ============= Daily Reset =============
  checkDailyReset(): void {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('rankme_last_daily_reset');
    
    if (lastReset !== today) {
      this.state.points.today = 0;
      localStorage.setItem('rankme_last_daily_reset', today);
      this.saveState();
    }
  }

  // ============= Force Refresh =============
  async forceRefreshFromDatabase(): Promise<void> {
    if (!this.userId) return;
    
    try {
      // Fetch fresh data from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .maybeSingle();
      
      if (profile) {
        this.syncWithProfile({
          current_streak: profile.current_streak || 0,
          longest_streak: profile.longest_streak || 0,
          total_points: profile.total_points || 0,
          weekly_points: profile.weekly_points || 0,
          tier: (profile.tier as Tier) || 'bronze',
        });
      }

      // Fetch rank
      const { data: rankData } = await supabase.rpc('get_user_rank', {
        user_uuid: this.userId
      });
      
      if (rankData && rankData.length > 0) {
        this.updateRank(rankData[0].rank, rankData[0].percentile);
      }
    } catch (e) {
      console.error('Error refreshing from database:', e);
    }
  }
}

// ============= Singleton Instance =============
export const trackingService = new TrackingService();

// ============= React Hook =============
export const useTrackingService = () => {
  return trackingService;
};
