import type { Tier } from '@/types';

// Tier calculation utility - single source of truth for UI tier display
export const calculateTier = (totalPoints: number): Tier => {
  if (totalPoints >= 50000) return 'champion';
  if (totalPoints >= 30000) return 'diamond';
  if (totalPoints >= 15000) return 'platinum';
  if (totalPoints >= 7500) return 'gold';
  if (totalPoints >= 3000) return 'silver';
  return 'bronze';
};

export const tierOrder: Tier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'];

export const tierThresholds: Record<string, { min: number; max: number; color: string }> = {
  bronze: { min: 0, max: 2999, color: '#CD7F32' },
  silver: { min: 3000, max: 7499, color: '#C0C0C0' },
  gold: { min: 7500, max: 14999, color: '#FFD700' },
  platinum: { min: 15000, max: 29999, color: '#E5E4E2' },
  diamond: { min: 30000, max: 49999, color: '#B9F2FF' },
  champion: { min: 50000, max: Infinity, color: '#FF6B35' },
};

export const getTierInfo = (tier: string) => {
  return tierThresholds[tier] || tierThresholds.bronze;
};
