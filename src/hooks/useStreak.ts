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

  // Calculate weekly progress based on streak
  const calculateWeeklyProgress = useCallback((streak: number, lastDate: string | null): boolean[] => {
    const progress = [false, false, false, false, false, false, false];
    if (!lastDate) return progress;
    
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday
    const lastActiveDay = new Date(lastDate);
    
    // Fill in completed days based on streak
    for (let i = 0; i < Math.min(streak, 7); i++) {
      const dayIndex = (todayDayOfWeek - i + 7) % 7;
      progress[dayIndex] = true;
    }
    
    return progress;
  }, []);

  // Check if user already logged in today
  const checkTodayLogin = useCallback((lastDate: string | null): boolean => {
    if (!lastDate) return false;
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = lastDate.split('T')[0];
    return today === lastLoginDate;
  }, []);

  // Load streak data from profile
  useEffect(() => {
    if (profile) {
      const todayClaimed = checkTodayLogin(profile.created_at);
      setStreakData({
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastActiveDate: null, // Will be fetched from daily_streaks
        weeklyProgress: calculateWeeklyProgress(profile.current_streak || 0, null),
        todayClaimed,
      });
    }
  }, [profile, calculateWeeklyProgress, checkTodayLogin]);

  // Fetch last active date from daily_streaks
  useEffect(() => {
    const fetchLastActiveDate = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('daily_streaks')
        .select('streak_date')
        .eq('user_id', user.id)
        .order('streak_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        const todayClaimed = checkTodayLogin(data.streak_date);
        setStreakData(prev => ({
          ...prev,
          lastActiveDate: data.streak_date,
          weeklyProgress: calculateWeeklyProgress(prev.currentStreak, data.streak_date),
          todayClaimed,
        }));
      }
    };
    
    fetchLastActiveDate();
  }, [user, calculateWeeklyProgress, checkTodayLogin]);

  // Update streak when user logs in
  const updateStreak = useCallback(async (): Promise<StreakReward | null> => {
    if (!user || isUpdating) return null;
    
    setIsUpdating(true);
    
    try {
      // Call the database function to update streak
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
      
      // Check for streak rewards
      const newStreak = (profile?.current_streak || 0) + 1;
      const reward = STREAK_REWARDS[newStreak];
      
      if (reward) {
        toast({
          title: `${reward.icon} ${reward.message}`,
          description: `+${reward.points} points earned!`,
        });
        return reward;
      }
      
      // Default daily bonus
      const dailyBonus: StreakReward = {
        points: 10 + Math.floor(newStreak / 7) * 5, // Bonus grows weekly
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
  }, [user, profile, isUpdating, refreshProfile]);

  // Claim daily reward
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

  // Get next reward info
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
