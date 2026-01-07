import React, { createContext, useContext, useState, useEffect } from 'react';

// Premium access configuration
const APP_CONFIG = {
  IS_DEV_MODE: true,
  FREE_PREMIUM_FOR_ALL: true,
};

// All unlocked premium features during development
const DEV_UNLOCKED_FEATURES = [
  'themes',
  'ai_tools',
  'advanced_analytics',
  'profile_customization',
  'priority_matchmaking',
  'ad_free',
] as const;

type PremiumFeature = typeof DEV_UNLOCKED_FEATURES[number];

interface PremiumContextType {
  isPremium: boolean;
  isDevMode: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  unlockedFeatures: readonly PremiumFeature[];
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(APP_CONFIG.FREE_PREMIUM_FOR_ALL);
  const [isDevMode] = useState(APP_CONFIG.IS_DEV_MODE);

  useEffect(() => {
    // In production, this would check user's subscription status
    // For now, grant premium to all during development
    if (APP_CONFIG.FREE_PREMIUM_FOR_ALL) {
      setIsPremium(true);
    }
  }, []);

  const hasFeature = (feature: PremiumFeature): boolean => {
    if (APP_CONFIG.FREE_PREMIUM_FOR_ALL) return true;
    return DEV_UNLOCKED_FEATURES.includes(feature);
  };

  return (
    <PremiumContext.Provider 
      value={{ 
        isPremium, 
        isDevMode, 
        hasFeature,
        unlockedFeatures: DEV_UNLOCKED_FEATURES,
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
