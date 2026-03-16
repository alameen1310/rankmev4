import { useAuth } from '@/contexts/AuthContext';
import { TIER_SYSTEM } from '@/services/gamification';
import { tierOrder } from '@/lib/tierUtils';
import { TierBadge } from '@/components/TierBadge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import type { Tier } from '@/types';

export const RankProgress = () => {
  const { profile } = useAuth();
  if (!profile) return null;

  const currentTier = profile.tier as Tier;
  const currentTierInfo = TIER_SYSTEM[currentTier];
  const currentIndex = tierOrder.indexOf(currentTier);
  const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  const nextTierInfo = nextTier ? TIER_SYSTEM[nextTier] : null;

  const pointsInTier = profile.total_points - currentTierInfo.minPoints;
  const tierRange = currentTierInfo.maxPoints - currentTierInfo.minPoints + 1;
  const progressPercent = nextTier
    ? Math.min(100, Math.round((pointsInTier / tierRange) * 100))
    : 100;

  const pointsToNext = nextTierInfo
    ? nextTierInfo.minPoints - profile.total_points
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TierBadge tier={currentTier} size="sm" />
          {nextTier && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <TierBadge tier={nextTier} size="sm" />
            </>
          )}
        </div>
        <span className="text-xs font-semibold text-primary">
          {profile.total_points.toLocaleString()} XP
        </span>
      </div>

      <Progress value={progressPercent} className="h-2.5 mb-2" />

      <p className="text-[11px] text-muted-foreground">
        {nextTier
          ? `${pointsToNext.toLocaleString()} XP to ${nextTierInfo?.name}`
          : '🏆 Max rank achieved!'}
      </p>
    </div>
  );
};
