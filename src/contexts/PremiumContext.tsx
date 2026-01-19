import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// All premium features
const PREMIUM_FEATURES = [
  'themes',
  'ai_tools',
  'advanced_analytics',
  'profile_customization',
  'priority_matchmaking',
  'ad_free',
] as const;

type PremiumFeature = typeof PREMIUM_FEATURES[number];

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  premiumExpiresAt: string | null;
  daysRemaining: number;
  hasFeature: (feature: PremiumFeature) => boolean;
  unlockedFeatures: readonly PremiumFeature[];
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const refreshPremiumStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsPremium(false);
        setPremiumExpiresAt(null);
        setDaysRemaining(0);
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('check-premium-status', {});

      if (response.error) {
        console.error('Error checking premium status:', response.error);
        setIsLoading(false);
        return;
      }

      const data = response.data;
      setIsPremium(data.is_premium || false);
      setPremiumExpiresAt(data.premium_expires_at || null);
      setDaysRemaining(data.days_remaining || 0);
    } catch (error) {
      console.error('Error fetching premium status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check premium status on mount
    refreshPremiumStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        refreshPremiumStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsPremium(false);
        setPremiumExpiresAt(null);
        setDaysRemaining(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshPremiumStatus]);

  const hasFeature = (feature: PremiumFeature): boolean => {
    if (isPremium) return true;
    return false;
  };

  return (
    <PremiumContext.Provider 
      value={{ 
        isPremium, 
        isLoading,
        premiumExpiresAt,
        daysRemaining,
        hasFeature,
        unlockedFeatures: isPremium ? PREMIUM_FEATURES : [],
        refreshPremiumStatus,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}