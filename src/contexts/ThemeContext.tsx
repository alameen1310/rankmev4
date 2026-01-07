import React, { createContext, useContext, useEffect, useState } from 'react';
import { PremiumTheme, PREMIUM_THEMES, getThemeById } from '@/themes/themeDefinitions';

interface ThemeContextType {
  theme: 'light' | 'dark';
  premiumTheme: PremiumTheme;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setPremiumTheme: (themeId: string) => void;
  availableThemes: PremiumTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [premiumTheme, setPremiumThemeState] = useState<PremiumTheme>(() => {
    const savedId = localStorage.getItem('rankme-premium-theme');
    if (savedId) {
      const found = getThemeById(savedId);
      if (found) return found;
    }
    // Default to light theme
    return PREMIUM_THEMES[0];
  });

  const theme = premiumTheme.isDark ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    
    // Set light/dark class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Apply premium theme CSS variables
    const { colors, gradients, shadows } = premiumTheme;
    
    // Apply colors
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--background-secondary', colors.backgroundSecondary);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.border);
    root.style.setProperty('--ring', colors.primary);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--popover', colors.card);
    root.style.setProperty('--popover-foreground', colors.cardForeground);
    
    // Apply gradients
    root.style.setProperty('--gradient-primary', gradients.primary);
    root.style.setProperty('--gradient-background', gradients.background);
    root.style.setProperty('--gradient-accent', gradients.accent);
    
    // Apply shadows
    root.style.setProperty('--shadow-glow', shadows.glow);
    root.style.setProperty('--shadow-card', shadows.card);
    
    // Save to localStorage
    localStorage.setItem('rankme-premium-theme', premiumTheme.id);
    localStorage.setItem('rankme-theme', theme);
  }, [premiumTheme, theme]);

  const toggleTheme = () => {
    // Find a theme with opposite isDark value
    const currentIsDark = premiumTheme.isDark;
    const oppositeThemes = PREMIUM_THEMES.filter(t => t.isDark !== currentIsDark);
    
    // Try to find a theme in the same category
    const sameCategory = oppositeThemes.find(t => t.category === premiumTheme.category);
    if (sameCategory) {
      setPremiumThemeState(sameCategory);
    } else {
      // Fallback to first opposite theme
      setPremiumThemeState(oppositeThemes[0] || PREMIUM_THEMES[0]);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    const targetIsDark = newTheme === 'dark';
    if (premiumTheme.isDark === targetIsDark) return;
    toggleTheme();
  };

  const setPremiumTheme = (themeId: string) => {
    const found = getThemeById(themeId);
    if (found) {
      setPremiumThemeState(found);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      premiumTheme,
      toggleTheme, 
      setTheme,
      setPremiumTheme,
      availableThemes: PREMIUM_THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
