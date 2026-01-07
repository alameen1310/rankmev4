export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  background: string;
  backgroundSecondary: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  success: string;
  warning: string;
  destructive: string;
}

export interface ThemeGradients {
  primary: string;
  background: string;
  accent: string;
}

export interface ThemeShadows {
  glow: string;
  card: string;
}

export interface PremiumTheme {
  id: string;
  name: string;
  emoji: string;
  type: 'premium' | 'free';
  category: 'vibrant' | 'pastel' | 'dark' | 'minimal' | 'seasonal';
  isDark: boolean;
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

// HSL values for CSS variables
export const PREMIUM_THEMES: PremiumTheme[] = [
  // ============ FREE THEMES ============
  {
    id: 'light',
    name: 'Clean Light',
    emoji: '☀️',
    type: 'free',
    category: 'minimal',
    isDark: false,
    colors: {
      primary: '231 83% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '210 40% 96%',
      secondaryForeground: '222 47% 17%',
      background: '210 40% 98%',
      backgroundSecondary: '210 40% 96%',
      foreground: '222 47% 17%',
      card: '0 0% 100%',
      cardForeground: '222 47% 17%',
      muted: '210 40% 96%',
      mutedForeground: '215 25% 40%',
      accent: '210 40% 94%',
      accentForeground: '222 47% 17%',
      border: '214 32% 91%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(231 83% 60%) 0%, hsl(231 83% 50%) 100%)',
      background: 'linear-gradient(180deg, hsl(210 40% 98%) 0%, hsl(210 40% 96%) 100%)',
      accent: 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(160 64% 52%) 100%)',
    },
    shadows: {
      glow: '0 0 20px hsl(231 83% 60% / 0.15)',
      card: '0 1px 3px 0 hsl(222 47% 17% / 0.1)',
    },
    preview: {
      primary: '#4361EE',
      secondary: '#F1F5F9',
      accent: '#10B981',
      background: '#F8FAFC',
    },
  },
  {
    id: 'dark',
    name: 'Classic Dark',
    emoji: '🌙',
    type: 'free',
    category: 'dark',
    isDark: true,
    colors: {
      primary: '239 84% 67%',
      primaryForeground: '0 0% 100%',
      secondary: '222 47% 16%',
      secondaryForeground: '210 40% 96%',
      background: '222 47% 7%',
      backgroundSecondary: '222 47% 11%',
      foreground: '210 40% 96%',
      card: '222 47% 11%',
      cardForeground: '210 40% 96%',
      muted: '222 47% 16%',
      mutedForeground: '215 20% 60%',
      accent: '222 47% 18%',
      accentForeground: '210 40% 96%',
      border: '222 47% 18%',
      success: '160 64% 52%',
      warning: '43 96% 56%',
      destructive: '0 62% 50%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(239 84% 55%) 100%)',
      background: 'linear-gradient(180deg, hsl(222 47% 7%) 0%, hsl(222 47% 11%) 100%)',
      accent: 'linear-gradient(135deg, hsl(160 64% 52%) 0%, hsl(160 84% 39%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(239 84% 67% / 0.3)',
      card: '0 1px 3px 0 hsl(0 0% 0% / 0.4)',
    },
    preview: {
      primary: '#6366F1',
      secondary: '#1E293B',
      accent: '#34D399',
      background: '#0F172A',
    },
  },

  // ============ VIBRANT THEMES ============
  {
    id: 'rotten-red',
    name: 'Rotten Red',
    emoji: '🍎',
    type: 'premium',
    category: 'vibrant',
    isDark: false,
    colors: {
      primary: '0 84% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '0 70% 95%',
      secondaryForeground: '0 60% 25%',
      background: '0 50% 98%',
      backgroundSecondary: '0 40% 96%',
      foreground: '0 60% 15%',
      card: '0 0% 100%',
      cardForeground: '0 60% 15%',
      muted: '0 30% 94%',
      mutedForeground: '0 25% 45%',
      accent: '330 80% 50%',
      accentForeground: '0 0% 100%',
      border: '0 30% 90%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(330 80% 50%) 100%)',
      background: 'linear-gradient(180deg, hsl(0 50% 98%) 0%, hsl(0 40% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(330 80% 50%) 0%, hsl(0 84% 60%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(0 84% 60% / 0.3)',
      card: '0 2px 8px hsl(0 84% 60% / 0.08)',
    },
    preview: {
      primary: '#EF4444',
      secondary: '#FEE2E2',
      accent: '#EC4899',
      background: '#FEF2F2',
    },
  },
  {
    id: 'paranormal-purple',
    name: 'Paranormal Purple',
    emoji: '🔮',
    type: 'premium',
    category: 'vibrant',
    isDark: false,
    colors: {
      primary: '263 70% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '270 70% 96%',
      secondaryForeground: '263 60% 25%',
      background: '270 50% 98%',
      backgroundSecondary: '270 40% 96%',
      foreground: '263 60% 15%',
      card: '0 0% 100%',
      cardForeground: '263 60% 15%',
      muted: '270 30% 94%',
      mutedForeground: '263 25% 45%',
      accent: '200 90% 50%',
      accentForeground: '0 0% 100%',
      border: '270 30% 90%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(285 70% 60%) 100%)',
      background: 'linear-gradient(180deg, hsl(270 50% 98%) 0%, hsl(270 40% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(200 90% 50%) 0%, hsl(263 70% 50%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(263 70% 50% / 0.35)',
      card: '0 2px 8px hsl(263 70% 50% / 0.08)',
    },
    preview: {
      primary: '#8B5CF6',
      secondary: '#EDE9FE',
      accent: '#0EA5E9',
      background: '#FAF5FF',
    },
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    emoji: '⚡',
    type: 'premium',
    category: 'vibrant',
    isDark: false,
    colors: {
      primary: '200 100% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '200 80% 95%',
      secondaryForeground: '200 80% 20%',
      background: '200 60% 98%',
      backgroundSecondary: '200 50% 96%',
      foreground: '200 80% 10%',
      card: '0 0% 100%',
      cardForeground: '200 80% 10%',
      muted: '200 40% 94%',
      mutedForeground: '200 30% 45%',
      accent: '170 100% 45%',
      accentForeground: '0 0% 100%',
      border: '200 40% 88%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(200 100% 50%) 0%, hsl(220 100% 60%) 100%)',
      background: 'linear-gradient(180deg, hsl(200 60% 98%) 0%, hsl(200 50% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(170 100% 45%) 0%, hsl(200 100% 50%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(200 100% 50% / 0.35)',
      card: '0 2px 8px hsl(200 100% 50% / 0.08)',
    },
    preview: {
      primary: '#0EA5E9',
      secondary: '#E0F2FE',
      accent: '#14B8A6',
      background: '#F0F9FF',
    },
  },

  // ============ PASTEL THEMES ============
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    emoji: '🍭',
    type: 'premium',
    category: 'pastel',
    isDark: false,
    colors: {
      primary: '330 80% 65%',
      primaryForeground: '0 0% 100%',
      secondary: '270 80% 95%',
      secondaryForeground: '330 60% 30%',
      background: '300 60% 98%',
      backgroundSecondary: '290 50% 96%',
      foreground: '300 50% 20%',
      card: '0 0% 100%',
      cardForeground: '300 50% 20%',
      muted: '290 40% 94%',
      mutedForeground: '300 30% 50%',
      accent: '200 80% 60%',
      accentForeground: '0 0% 100%',
      border: '290 40% 90%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(330 80% 65%) 0%, hsl(280 80% 65%) 100%)',
      background: 'linear-gradient(180deg, hsl(300 60% 98%) 0%, hsl(290 50% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(200 80% 60%) 0%, hsl(330 80% 65%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(330 80% 65% / 0.3)',
      card: '0 2px 8px hsl(330 80% 65% / 0.08)',
    },
    preview: {
      primary: '#F472B6',
      secondary: '#F5D0FE',
      accent: '#38BDF8',
      background: '#FDF4FF',
    },
  },
  {
    id: 'lemonade-stand',
    name: 'Lemonade Stand',
    emoji: '🍋',
    type: 'premium',
    category: 'pastel',
    isDark: false,
    colors: {
      primary: '45 95% 55%',
      primaryForeground: '45 90% 15%',
      secondary: '45 90% 94%',
      secondaryForeground: '45 80% 25%',
      background: '50 80% 98%',
      backgroundSecondary: '48 70% 96%',
      foreground: '45 80% 15%',
      card: '0 0% 100%',
      cardForeground: '45 80% 15%',
      muted: '48 50% 94%',
      mutedForeground: '45 40% 45%',
      accent: '120 70% 45%',
      accentForeground: '0 0% 100%',
      border: '48 50% 88%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(45 95% 55%) 0%, hsl(35 95% 55%) 100%)',
      background: 'linear-gradient(180deg, hsl(50 80% 98%) 0%, hsl(48 70% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(120 70% 45%) 0%, hsl(45 95% 55%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(45 95% 55% / 0.35)',
      card: '0 2px 8px hsl(45 95% 55% / 0.1)',
    },
    preview: {
      primary: '#FACC15',
      secondary: '#FEF9C3',
      accent: '#22C55E',
      background: '#FEFCE8',
    },
  },
  {
    id: 'arctic-sky',
    name: 'Arctic Sky',
    emoji: '❄️',
    type: 'premium',
    category: 'pastel',
    isDark: false,
    colors: {
      primary: '195 90% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '195 80% 95%',
      secondaryForeground: '195 70% 25%',
      background: '195 70% 98%',
      backgroundSecondary: '195 60% 96%',
      foreground: '195 70% 15%',
      card: '0 0% 100%',
      cardForeground: '195 70% 15%',
      muted: '195 50% 94%',
      mutedForeground: '195 40% 45%',
      accent: '210 100% 55%',
      accentForeground: '0 0% 100%',
      border: '195 50% 88%',
      success: '160 84% 39%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(195 90% 55%) 0%, hsl(210 100% 60%) 100%)',
      background: 'linear-gradient(180deg, hsl(195 70% 98%) 0%, hsl(195 60% 95%) 100%)',
      accent: 'linear-gradient(135deg, hsl(210 100% 55%) 0%, hsl(195 90% 55%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(195 90% 55% / 0.3)',
      card: '0 2px 8px hsl(195 90% 55% / 0.08)',
    },
    preview: {
      primary: '#22D3EE',
      secondary: '#CFFAFE',
      accent: '#3B82F6',
      background: '#ECFEFF',
    },
  },

  // ============ DARK THEMES ============
  {
    id: 'black-cherry',
    name: 'Black Cherry',
    emoji: '🍒',
    type: 'premium',
    category: 'dark',
    isDark: true,
    colors: {
      primary: '350 80% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '350 50% 15%',
      secondaryForeground: '350 20% 85%',
      background: '350 40% 5%',
      backgroundSecondary: '350 35% 8%',
      foreground: '350 10% 95%',
      card: '350 35% 10%',
      cardForeground: '350 10% 95%',
      muted: '350 30% 15%',
      mutedForeground: '350 15% 60%',
      accent: '330 70% 50%',
      accentForeground: '0 0% 100%',
      border: '350 30% 18%',
      success: '160 64% 52%',
      warning: '43 96% 56%',
      destructive: '0 62% 50%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(350 80% 45%) 0%, hsl(330 70% 50%) 100%)',
      background: 'linear-gradient(180deg, hsl(350 40% 5%) 0%, hsl(350 35% 8%) 100%)',
      accent: 'linear-gradient(135deg, hsl(330 70% 50%) 0%, hsl(350 80% 45%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(350 80% 45% / 0.4)',
      card: '0 2px 8px hsl(0 0% 0% / 0.3)',
    },
    preview: {
      primary: '#DC2626',
      secondary: '#450A0A',
      accent: '#EC4899',
      background: '#1C0808',
    },
  },
  {
    id: 'wicked',
    name: 'Wicked',
    emoji: '🧙',
    type: 'premium',
    category: 'dark',
    isDark: true,
    colors: {
      primary: '142 70% 50%',
      primaryForeground: '0 0% 0%',
      secondary: '142 40% 12%',
      secondaryForeground: '142 20% 85%',
      background: '0 0% 3%',
      backgroundSecondary: '0 0% 7%',
      foreground: '0 0% 95%',
      card: '0 0% 8%',
      cardForeground: '0 0% 95%',
      muted: '0 0% 14%',
      mutedForeground: '0 0% 60%',
      accent: '190 90% 50%',
      accentForeground: '0 0% 0%',
      border: '0 0% 18%',
      success: '142 70% 50%',
      warning: '43 96% 56%',
      destructive: '0 62% 50%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 70% 50%) 0%, hsl(142 70% 40%) 100%)',
      background: 'linear-gradient(180deg, hsl(0 0% 3%) 0%, hsl(0 0% 7%) 100%)',
      accent: 'linear-gradient(135deg, hsl(190 90% 50%) 0%, hsl(142 70% 50%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(142 70% 50% / 0.4)',
      card: '0 2px 8px hsl(0 0% 0% / 0.4)',
    },
    preview: {
      primary: '#22C55E',
      secondary: '#14532D',
      accent: '#06B6D4',
      background: '#030303',
    },
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    emoji: '🌊',
    type: 'premium',
    category: 'dark',
    isDark: true,
    colors: {
      primary: '200 100% 55%',
      primaryForeground: '0 0% 100%',
      secondary: '210 60% 12%',
      secondaryForeground: '200 30% 85%',
      background: '215 70% 5%',
      backgroundSecondary: '215 60% 8%',
      foreground: '200 20% 95%',
      card: '215 55% 10%',
      cardForeground: '200 20% 95%',
      muted: '215 45% 15%',
      mutedForeground: '200 20% 60%',
      accent: '175 90% 45%',
      accentForeground: '0 0% 0%',
      border: '215 40% 18%',
      success: '160 64% 52%',
      warning: '43 96% 56%',
      destructive: '0 62% 50%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(200 100% 55%) 0%, hsl(220 100% 60%) 100%)',
      background: 'linear-gradient(180deg, hsl(215 70% 5%) 0%, hsl(215 60% 8%) 100%)',
      accent: 'linear-gradient(135deg, hsl(175 90% 45%) 0%, hsl(200 100% 55%) 100%)',
    },
    shadows: {
      glow: '0 0 24px hsl(200 100% 55% / 0.35)',
      card: '0 2px 8px hsl(0 0% 0% / 0.35)',
    },
    preview: {
      primary: '#0EA5E9',
      secondary: '#0C4A6E',
      accent: '#14B8A6',
      background: '#0A1628',
    },
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    emoji: '🌃',
    type: 'premium',
    category: 'dark',
    isDark: true,
    colors: {
      primary: '280 100% 65%',
      primaryForeground: '0 0% 100%',
      secondary: '280 50% 15%',
      secondaryForeground: '280 30% 85%',
      background: '270 50% 4%',
      backgroundSecondary: '270 45% 7%',
      foreground: '280 10% 95%',
      card: '270 40% 10%',
      cardForeground: '280 10% 95%',
      muted: '270 35% 16%',
      mutedForeground: '270 15% 60%',
      accent: '320 100% 60%',
      accentForeground: '0 0% 100%',
      border: '270 30% 20%',
      success: '160 64% 52%',
      warning: '43 96% 56%',
      destructive: '0 62% 50%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(280 100% 65%) 0%, hsl(320 100% 60%) 100%)',
      background: 'linear-gradient(180deg, hsl(270 50% 4%) 0%, hsl(270 45% 7%) 100%)',
      accent: 'linear-gradient(135deg, hsl(320 100% 60%) 0%, hsl(280 100% 65%) 100%)',
    },
    shadows: {
      glow: '0 0 30px hsl(280 100% 65% / 0.5)',
      card: '0 2px 8px hsl(0 0% 0% / 0.4)',
    },
    preview: {
      primary: '#A855F7',
      secondary: '#581C87',
      accent: '#F472B6',
      background: '#0D0517',
    },
  },
];

export const getThemeById = (id: string): PremiumTheme | undefined => {
  return PREMIUM_THEMES.find(t => t.id === id);
};

export const getThemesByCategory = (category: PremiumTheme['category']): PremiumTheme[] => {
  return PREMIUM_THEMES.filter(t => t.category === category);
};

export const getFreeThemes = (): PremiumTheme[] => {
  return PREMIUM_THEMES.filter(t => t.type === 'free');
};

export const getPremiumThemes = (): PremiumTheme[] => {
  return PREMIUM_THEMES.filter(t => t.type === 'premium');
};
