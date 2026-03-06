import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  weeklyProgress: boolean[];
  todayClaimed: boolean;
}

interface StreakReward {
  points: number;
  badge?: string;
  message: string;
  icon: string;
}

const STREAK_REWARDS: Record<number, StreakReward> = {
  1: { points: 10, message: "Day 1! Welcome back!", icon: "🌟" },
  3: { points: 50, badge: "three-day-streak", message: "3-day streak! You're on fire!", icon: "🔥" },
  7: { points: 150, badge: "weekly-warrior", message: "Weekly warrior! 7 days strong!", icon: "⚡" },
  14: { points: 500, badge: "fortnight-champ", message: "2-week champion!", icon: "🏆" },
  30: { points: 2000, badge: "monthly-master", message: "Monthly master! Incredible dedication!", icon: "👑" },
  60: { points: 5000, badge: "streak-legend", message: "60-day legend!", icon: "💎" },
  100: { points: 10000, badge: "century-club", message: "Century club! 100 days!", icon: "🌟" },
};

export const useStreak = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    weeklyProgress: [false, false, false, false, false, false, false],
    todayClaimed: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const calculateWeeklyProgress = useCallback((streak: number, lastDate: string | null): boolean[] => {
    const progress = [false, false, false, false, false, false, false];
    if (!lastDate) return progress;
    
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    
    for (let i = 0; i < Math.min(streak, 7); i++) {
      const dayIndex = (todayDayOfWeek - i + 7) % 7;
      progress[dayIndex] = true;
    }
    
    return progress;
  }, []);

  const isSameDay = useCallback((dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const compareDate = dateStr.split('T')[0];
    return today === compareDate;
  }, []);

  // Load streak data from profile + daily_streaks
  useEffect(() => {
    if (!profile || !user) return;
    
    const loadStreakData = async () => {
      // Check last active date from profile
      const lastActive = (profile as any).last_active_date || null;
      const todayClaimed = isSameDay(lastActive);
      
      // Also check daily_streaks table for more accurate data
      const { data: streakRecord } = await supabase
        .from('daily_streaks')
        .select('streak_date')
        .eq('user_id', user.id)
        .order('streak_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const effectiveLastDate = streakRecord?.streak_date || lastActive;
      const effectiveTodayClaimed = isSameDay(effectiveLastDate);
      
      setStreakData({
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastActiveDate: effectiveLastDate,
        weeklyProgress: calculateWeeklyProgress(profile.current_streak || 0, effectiveLastDate),
        todayClaimed: effectiveTodayClaimed,
      });
    };
    
    loadStreakData();
  }, [profile, user, calculateWeeklyProgress, isSameDay]);

  const updateStreak = useCallback(async (): Promise<StreakReward | null> => {
    if (!user || isUpdating) return null;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase.rpc('update_user_streak', {
        user_uuid: user.id,
      });
      
      if (error) {
        console.error('Error updating streak:', error);
        setIsUpdating(false);
        return null;
      }
      
      // Refresh profile to get updated streak
      await refreshProfile();
      
      // Fetch the new streak value directly
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', user.id)
        .maybeSingle();
      
      const newStreak = updatedProfile?.current_streak || 1;
      const reward = STREAK_REWARDS[newStreak];
      
      if (reward) {
        toast({
          title: `${reward.icon} ${reward.message}`,
          description: `+${reward.points} points earned!`,
        });
        setIsUpdating(false);
        return reward;
      }
      
      const dailyBonus: StreakReward = {
        points: 10 + Math.floor(newStreak / 7) * 5,
        message: `Day ${newStreak}! Keep going!`,
        icon: "✨",
      };
      
      toast({
        title: `${dailyBonus.icon} Daily Login Bonus`,
        description: `+${dailyBonus.points} points`,
      });
      
      setIsUpdating(false);
      return dailyBonus;
    } catch (error) {
      console.error('Error in updateStreak:', error);
      setIsUpdating(false);
      return null;
    }
  }, [user, isUpdating, refreshProfile]);

  const claimDailyReward = useCallback(async () => {
    if (streakData.todayClaimed) {
      toast({
        title: "Already Claimed",
        description: "Come back tomorrow for your next reward!",
        variant: "destructive",
      });
      return null;
    }
    
    const reward = await updateStreak();
    
    if (reward) {
      setStreakData(prev => ({
        ...prev,
        todayClaimed: true,
        currentStreak: prev.currentStreak + 1,
      }));
    }
    
    return reward;
  }, [streakData.todayClaimed, updateStreak]);

  const getNextReward = useCallback((): { daysUntil: number; reward: StreakReward } | null => {
    const rewardDays = Object.keys(STREAK_REWARDS).map(Number).sort((a, b) => a - b);
    const nextRewardDay = rewardDays.find(day => day > streakData.currentStreak);
    
    if (nextRewardDay) {
      return {
        daysUntil: nextRewardDay - streakData.currentStreak,
        reward: STREAK_REWARDS[nextRewardDay],
      };
    }
    
    return null;
  }, [streakData.currentStreak]);

  return {
    streakData,
    updateStreak,
    claimDailyReward,
    getNextReward,
    isUpdating,
    STREAK_REWARDS,
  };
};
