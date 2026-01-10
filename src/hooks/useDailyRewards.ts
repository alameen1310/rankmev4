import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WEEKLY_REWARDS, type DailyReward } from '@/services/gamification';

interface DailyRewardsState {
  streak: number;
  lastClaimDate: string | null;
  weekProgress: boolean[];
  todayClaimed: boolean;
  nextResetTime: Date | null;
}

const STORAGE_KEY = 'rankme_daily_rewards';

export const useDailyRewards = () => {
  const { user, refreshProfile } = useAuth();
  const [state, setState] = useState<DailyRewardsState>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        const lastClaimDay = parsed.lastClaimDate?.split('T')[0];
        
        // Check if it's a new day
        const todayClaimed = lastClaimDay === today;
        
        // Calculate if streak should reset (missed more than 1 day)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let streak = parsed.streak || 0;
        if (lastClaimDay && lastClaimDay !== today && lastClaimDay !== yesterdayStr) {
          // Streak broken - missed more than one day
          streak = 0;
        }
        
        return {
          streak,
          lastClaimDate: parsed.lastClaimDate,
          weekProgress: parsed.weekProgress || [false, false, false, false, false, false, false],
          todayClaimed,
          nextResetTime: todayClaimed ? getNextMidnight() : null,
        };
      } catch (e) {
        console.error('Error parsing saved rewards:', e);
      }
    }
    return {
      streak: 0,
      lastClaimDate: null,
      weekProgress: [false, false, false, false, false, false, false],
      todayClaimed: false,
      nextResetTime: null,
    };
  });

  // Calculate next midnight
  function getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Check for day reset
  useEffect(() => {
    const checkDayReset = () => {
      const today = new Date().toISOString().split('T')[0];
      const lastClaimDay = state.lastClaimDate?.split('T')[0];
      
      if (lastClaimDay && lastClaimDay !== today && state.todayClaimed) {
        setState(prev => ({
          ...prev,
          todayClaimed: false,
          nextResetTime: null,
        }));
      }
    };

    // Check immediately and every minute
    checkDayReset();
    const interval = setInterval(checkDayReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastClaimDate, state.todayClaimed]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      streak: state.streak,
      lastClaimDate: state.lastClaimDate,
      weekProgress: state.weekProgress,
    }));
  }, [state.streak, state.lastClaimDate, state.weekProgress]);

  // Claim daily reward
  const claimDailyReward = useCallback(async () => {
    if (state.todayClaimed) {
      toast({
        title: "Already Claimed",
        description: "Come back tomorrow for your next reward!",
        variant: "destructive",
      });
      return null;
    }

    const today = new Date().toISOString();
    const todayDate = today.split('T')[0];
    const lastClaimDay = state.lastClaimDate?.split('T')[0];
    
    // Calculate new streak
    let newStreak = 1;
    if (lastClaimDay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastClaimDay === yesterdayStr) {
        // Consecutive day
        newStreak = state.streak + 1;
      } else if (lastClaimDay === todayDate) {
        // Same day (shouldn't happen but handle it)
        return null;
      }
      // Otherwise streak resets to 1
    }

    // Calculate week progress
    const dayOfWeek = new Date().getDay(); // 0 = Sunday
    const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon = 0, Sun = 6
    const newWeekProgress = [...state.weekProgress];
    newWeekProgress[adjustedDayIndex] = true;

    // Get reward for current day in weekly cycle
    const rewardDayIndex = (newStreak - 1) % 7;
    const todayReward = WEEKLY_REWARDS[rewardDayIndex];
    
    // Award points if user is logged in
    if (user && todayReward.reward.type === 'points') {
      try {
        const pointsToAdd = todayReward.reward.value as number;
        await supabase.rpc('increment_user_points', {
          p_user_id: user.id,
          p_points_to_add: pointsToAdd,
          p_weekly_points_to_add: pointsToAdd,
          p_increment_quizzes: 0,
        });
        await refreshProfile();
      } catch (error) {
        console.error('Error adding points:', error);
      }
    }

    // Update state
    setState({
      streak: newStreak,
      lastClaimDate: today,
      weekProgress: newWeekProgress,
      todayClaimed: true,
      nextResetTime: getNextMidnight(),
    });

    const reward = {
      day: rewardDayIndex + 1,
      streak: newStreak,
      reward: todayReward.reward,
    };

    toast({
      title: `🎉 Day ${rewardDayIndex + 1} Reward Claimed!`,
      description: todayReward.reward.type === 'points' 
        ? `+${todayReward.reward.value} points earned!`
        : 'XP Boost activated!',
    });

    return reward;
  }, [state, user, refreshProfile]);

  // Get time until next reward
  const getTimeUntilReset = useCallback(() => {
    if (!state.nextResetTime) return null;
    
    const now = new Date();
    const diff = state.nextResetTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }, [state.nextResetTime]);

  // Get current week day reward
  const getCurrentDayReward = useCallback((): DailyReward => {
    const rewardIndex = (state.streak) % 7;
    return WEEKLY_REWARDS[rewardIndex];
  }, [state.streak]);

  return {
    streak: state.streak,
    lastClaimDate: state.lastClaimDate,
    weekProgress: state.weekProgress,
    todayClaimed: state.todayClaimed,
    claimDailyReward,
    getTimeUntilReset,
    getCurrentDayReward,
    weeklyRewards: WEEKLY_REWARDS,
  };
};
