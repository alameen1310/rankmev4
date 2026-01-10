import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BADGES, type Badge } from '@/services/gamification';

const STORAGE_KEY = 'rankme_showcase_badges';
const MAX_SHOWCASE_BADGES = 3;

interface ShowcaseState {
  showcaseBadges: string[];
  isSelectionMode: boolean;
}

export const useBadgeShowcase = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ShowcaseState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return {
          showcaseBadges: JSON.parse(saved),
          isSelectionMode: false,
        };
      } catch (e) {
        console.error('Error parsing showcase badges:', e);
      }
    }
    return {
      showcaseBadges: [],
      isSelectionMode: false,
    };
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.showcaseBadges));
  }, [state.showcaseBadges]);

  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSelectionMode: !prev.isSelectionMode,
    }));
  }, []);

  // Toggle badge in showcase
  const toggleBadgeSelection = useCallback((badgeId: string) => {
    setState(prev => {
      if (prev.showcaseBadges.includes(badgeId)) {
        // Remove from showcase
        return {
          ...prev,
          showcaseBadges: prev.showcaseBadges.filter(id => id !== badgeId),
        };
      } else {
        // Add to showcase (max 3)
        if (prev.showcaseBadges.length >= MAX_SHOWCASE_BADGES) {
          toast({
            title: "Showcase Full",
            description: `You can only showcase ${MAX_SHOWCASE_BADGES} badges. Remove one first!`,
            variant: "destructive",
          });
          return prev;
        }
        
        toast({
          title: "Badge Added",
          description: "Badge added to your showcase!",
        });
        
        return {
          ...prev,
          showcaseBadges: [...prev.showcaseBadges, badgeId],
        };
      }
    });
  }, []);

  // Get showcase badge details
  const getShowcaseBadges = useCallback((): Badge[] => {
    return state.showcaseBadges
      .map(id => BADGES.find(b => b.id === id))
      .filter((b): b is Badge => b !== undefined);
  }, [state.showcaseBadges]);

  // Check if badge is in showcase
  const isInShowcase = useCallback((badgeId: string): boolean => {
    return state.showcaseBadges.includes(badgeId);
  }, [state.showcaseBadges]);

  // Save to database
  const saveToDatabase = useCallback(async () => {
    if (!user) return;
    
    try {
      // For now we just use localStorage, but this could sync to user_achievements
      toast({
        title: "Showcase Saved",
        description: "Your featured badges have been updated!",
      });
    } catch (error) {
      console.error('Error saving showcase:', error);
    }
  }, [user]);

  return {
    showcaseBadges: state.showcaseBadges,
    isSelectionMode: state.isSelectionMode,
    toggleSelectionMode,
    toggleBadgeSelection,
    getShowcaseBadges,
    isInShowcase,
    saveToDatabase,
    maxBadges: MAX_SHOWCASE_BADGES,
  };
};
