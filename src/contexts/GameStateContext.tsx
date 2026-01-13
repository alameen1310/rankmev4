import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tier } from '@/types';
import { getTierFromPoints } from '@/services/leaderboard';

interface GameState {
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  tier: Tier;
  totalPoints: number;
  weeklyPoints: number;
  rank: number | null;
  percentile: number | null;
  showcaseBadges: string[];
  equippedTitle: string | null;
}

interface Notification {
  id: string;
  type: 'chat' | 'friend_request' | 'battle_invite' | 'achievement' | 'reward' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface GameStateContextType {
  state: GameState;
  notifications: Notification[];
  unreadCount: number;
  updateStreak: (newStreak: number) => void;
  updatePoints: (points: number, weeklyPoints: number) => void;
  updateRank: (rank: number, percentile: number) => void;
  setShowcaseBadges: (badges: string[]) => void;
  setEquippedTitle: (title: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  refreshGameState: () => Promise<void>;
}

const defaultState: GameState = {
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  tier: 'bronze',
  totalPoints: 0,
  weeklyPoints: 0,
  rank: null,
  percentile: null,
  showcaseBadges: [],
  equippedTitle: null,
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

const STORAGE_KEY = 'rankme_game_state';
const NOTIFICATIONS_KEY = 'rankme_notifications';

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sync state with profile when it changes
  useEffect(() => {
    if (profile) {
      setState(prev => ({
        ...prev,
        streak: profile.current_streak,
        longestStreak: profile.longest_streak,
        tier: profile.tier,
        totalPoints: profile.total_points,
        weeklyPoints: profile.weekly_points,
      }));
    }
  }, [profile]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Broadcast state change for cross-component sync
    window.dispatchEvent(new CustomEvent('gamestate-updated', { detail: state }));
  }, [state]);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Fetch user rank on mount
  useEffect(() => {
    if (user) {
      fetchUserRank();
    }
  }, [user]);

  const fetchUserRank = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_rank', {
        user_uuid: user.id
      });
      
      if (data && data.length > 0) {
        setState(prev => ({
          ...prev,
          rank: data[0].rank,
          percentile: data[0].percentile,
        }));
      }
    } catch (error) {
      console.error('Error fetching rank:', error);
    }
  };

  const refreshGameState = useCallback(async () => {
    await refreshProfile();
    await fetchUserRank();
  }, [refreshProfile]);

  const updateStreak = useCallback((newStreak: number) => {
    setState(prev => ({
      ...prev,
      streak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
    }));
  }, []);

  const updatePoints = useCallback((points: number, weeklyPoints: number) => {
    setState(prev => ({
      ...prev,
      totalPoints: points,
      weeklyPoints,
      tier: getTierFromPoints(points),
    }));
  }, []);

  const updateRank = useCallback((rank: number, percentile: number) => {
    setState(prev => ({
      ...prev,
      rank,
      percentile,
    }));
  }, []);

  const setShowcaseBadges = useCallback((badges: string[]) => {
    setState(prev => ({
      ...prev,
      showcaseBadges: badges.slice(0, 3), // Max 3 badges
    }));
    
    // Save to localStorage for persistence
    localStorage.setItem('rankme_showcase_badges', JSON.stringify(badges.slice(0, 3)));
  }, []);

  const setEquippedTitle = useCallback((title: string | null) => {
    setState(prev => ({
      ...prev,
      equippedTitle: title,
    }));
    
    // Save to localStorage
    localStorage.setItem('rankme_equipped_title', title || '');
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Load showcase badges and title from localStorage on mount
  useEffect(() => {
    const savedBadges = localStorage.getItem('rankme_showcase_badges');
    const savedTitle = localStorage.getItem('rankme_equipped_title');
    
    if (savedBadges) {
      try {
        const badges = JSON.parse(savedBadges);
        setState(prev => ({ ...prev, showcaseBadges: badges }));
      } catch {}
    }
    
    if (savedTitle) {
      setState(prev => ({ ...prev, equippedTitle: savedTitle }));
    }
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        state,
        notifications,
        unreadCount,
        updateStreak,
        updatePoints,
        updateRank,
        setShowcaseBadges,
        setEquippedTitle,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        refreshGameState,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
