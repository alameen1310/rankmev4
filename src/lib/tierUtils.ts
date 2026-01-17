// Tier calculation utility - aligned with database thresholds
export const calculateTier = (totalPoints: number): string => {
  if (totalPoints >= 50000) return 'diamond';
  if (totalPoints >= 25000) return 'platinum';
  if (totalPoints >= 10000) return 'gold';
  if (totalPoints >= 5000) return 'silver';
  return 'bronze';
};

export const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const tierThresholds: Record<string, { min: number; max: number; color: string }> = {
  bronze: { min: 0, max: 4999, color: '#CD7F32' },
  silver: { min: 5000, max: 9999, color: '#C0C0C0' },
  gold: { min: 10000, max: 24999, color: '#FFD700' },
  platinum: { min: 25000, max: 49999, color: '#E5E4E2' },
  diamond: { min: 50000, max: Infinity, color: '#B9F2FF' },
};

export const getTierInfo = (tier: string) => {
  return tierThresholds[tier] || tierThresholds.bronze;
};
