/**
 * React Hook for Tracking Service
 * Provides reactive state updates across all components
 */

import { useState, useEffect, useCallback } from 'react';
import { trackingService, TRACKING_EVENTS } from '@/services/trackingService';
import { useAuth } from '@/contexts/AuthContext';
import type { Tier } from '@/types';

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

export const useTracking = () => {
  const { user, profile } = useAuth();
  
  const [streak, setStreak] = useState<StreakData>(trackingService.getStreakData());
  const [points, setPoints] = useState<PointsData>(trackingService.getPointsData());
  const [rank, setRank] = useState<RankData>(trackingService.getRankData());
  const [showcaseBadges, setShowcaseBadges] = useState<string[]>(trackingService.getShowcaseBadges());
  const [equippedTitle, setEquippedTitle] = useState<string | null>(trackingService.getEquippedTitle());

  // Sync with profile on mount and when profile changes
  useEffect(() => {
    if (profile) {
      trackingService.setUserId(profile.id);
      trackingService.syncWithProfile({
        current_streak: profile.current_streak,
        longest_streak: profile.longest_streak,
        total_points: profile.total_points,
        weekly_points: profile.weekly_points,
        tier: profile.tier,
      });
      
      // Update local state
      setStreak(trackingService.getStreakData());
      setPoints(trackingService.getPointsData());
      setRank(trackingService.getRankData());
    }
  }, [profile]);

  // Check daily reset on mount
  useEffect(() => {
    trackingService.checkDailyReset();
  }, []);

  // Listen for tracking events
  useEffect(() => {
    const handleStreakUpdate = (e: CustomEvent) => {
      setStreak(e.detail);
    };
    
    const handlePointsUpdate = (e: CustomEvent) => {
      setPoints(e.detail);
    };
    
    const handleRankUpdate = (e: CustomEvent) => {
      setRank(prev => ({ ...prev, ...e.detail }));
    };
    
    const handleBadgesUpdate = (e: CustomEvent) => {
      setShowcaseBadges(e.detail);
    };
    
    const handleTitleUpdate = (e: CustomEvent) => {
      setEquippedTitle(e.detail);
    };
    
    const handleStateSync = () => {
      setStreak(trackingService.getStreakData());
      setPoints(trackingService.getPointsData());
      setRank(trackingService.getRankData());
      setShowcaseBadges(trackingService.getShowcaseBadges());
      setEquippedTitle(trackingService.getEquippedTitle());
    };

    window.addEventListener(TRACKING_EVENTS.STREAK_UPDATED, handleStreakUpdate as EventListener);
    window.addEventListener(TRACKING_EVENTS.POINTS_UPDATED, handlePointsUpdate as EventListener);
    window.addEventListener(TRACKING_EVENTS.RANK_UPDATED, handleRankUpdate as EventListener);
    window.addEventListener(TRACKING_EVENTS.BADGES_UPDATED, handleBadgesUpdate as EventListener);
    window.addEventListener(TRACKING_EVENTS.TITLE_UPDATED, handleTitleUpdate as EventListener);
    window.addEventListener(TRACKING_EVENTS.STATE_SYNCED, handleStateSync);

    return () => {
      window.removeEventListener(TRACKING_EVENTS.STREAK_UPDATED, handleStreakUpdate as EventListener);
      window.removeEventListener(TRACKING_EVENTS.POINTS_UPDATED, handlePointsUpdate as EventListener);
      window.removeEventListener(TRACKING_EVENTS.RANK_UPDATED, handleRankUpdate as EventListener);
      window.removeEventListener(TRACKING_EVENTS.BADGES_UPDATED, handleBadgesUpdate as EventListener);
      window.removeEventListener(TRACKING_EVENTS.TITLE_UPDATED, handleTitleUpdate as EventListener);
      window.removeEventListener(TRACKING_EVENTS.STATE_SYNCED, handleStateSync);
    };
  }, []);

  // Actions
  const updateStreak = useCallback(async (type: 'login' | 'quiz' = 'login') => {
    return trackingService.updateStreak(type);
  }, []);

  const addPoints = useCallback((amount: number, source: string, subject?: string) => {
    return trackingService.addPoints(amount, source, subject);
  }, []);

  const updateRank = useCallback((globalRank: number, percentile: number) => {
    trackingService.updateRank(globalRank, percentile);
  }, []);

  const updateShowcaseBadges = useCallback((badges: string[]) => {
    trackingService.setShowcaseBadges(badges);
  }, []);

  const updateEquippedTitle = useCallback((title: string | null) => {
    trackingService.setEquippedTitle(title);
  }, []);

  const refreshFromDatabase = useCallback(async () => {
    await trackingService.forceRefreshFromDatabase();
  }, []);

  const canAwardQuizPoints = useCallback((quizId: string) => {
    return trackingService.canAwardQuizPoints(quizId);
  }, []);

  const recordQuizCompletion = useCallback((quizId: string, score: number, points: number, subject: string) => {
    trackingService.recordQuizCompletion(quizId, score, points, subject);
  }, []);

  return {
    // State
    streak,
    points,
    rank,
    showcaseBadges,
    equippedTitle,
    
    // Actions
    updateStreak,
    addPoints,
    updateRank,
    updateShowcaseBadges,
    updateEquippedTitle,
    refreshFromDatabase,
    canAwardQuizPoints,
    recordQuizCompletion,
  };
};

// Convenience hooks for specific features
export const useStreak = () => {
  const { streak, updateStreak } = useTracking();
  return { streakData: streak, updateStreak };
};

export const usePoints = () => {
  const { points, addPoints, rank } = useTracking();
  return { points, rank, addPoints };
};

export const usePublicProfile = () => {
  const { showcaseBadges, equippedTitle, updateShowcaseBadges, updateEquippedTitle } = useTracking();
  return { showcaseBadges, equippedTitle, updateShowcaseBadges, updateEquippedTitle };
};
