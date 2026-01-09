import { getTierInfo, getNextTierInfo, TIER_SYSTEM } from '@/services/gamification';
import { cn } from '@/lib/utils';
import { ChevronRight, Star, Trophy } from 'lucide-react';
import type { Tier } from '@/types';

interface TierProgressProps {
  points: number;
  className?: string;
  showBenefits?: boolean;
  compact?: boolean;
}

export const TierProgress = ({ points, className, showBenefits = true, compact = false }: TierProgressProps) => {
  const currentTier = getTierInfo(points);
  const nextTierData = getNextTierInfo(points);
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${currentTier.color}20` }}
        >
          {currentTier.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm" style={{ color: currentTier.color }}>
              {currentTier.name}
            </span>
            {nextTierData && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {nextTierData.nextTier.name}
                </span>
              </>
            )}
          </div>
          {nextTierData && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${nextTierData.progress}%`,
                  background: `linear-gradient(90deg, ${currentTier.color}, ${nextTierData.nextTier.color})`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      {/* Current Tier Display */}
      <div className="flex items-center gap-4 mb-4">
        <div 
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl",
            "shadow-lg transition-transform hover:scale-105",
            currentTier.tier === 'champion' && 'animate-glow'
          )}
          style={{ 
            backgroundColor: `${currentTier.color}20`,
            boxShadow: `0 4px 20px ${currentTier.color}30`,
          }}
        >
          {currentTier.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-xl font-bold"
              style={{ color: currentTier.color }}
            >
              {currentTier.name}
            </span>
            {currentTier.tier === 'champion' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-semibold">
                MAX TIER
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {points.toLocaleString()} points • {currentTier.xpMultiplier}x XP bonus
          </p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTierData && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">
              Progress to {nextTierData.nextTier.name}
            </span>
            <span className="text-xs font-medium">
              {nextTierData.pointsNeeded.toLocaleString()} points needed
            </span>
          </div>
          
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${Math.min(nextTierData.progress, 100)}%`,
                background: `linear-gradient(90deg, ${currentTier.color}, ${nextTierData.nextTier.color})`,
              }}
            />
          </div>
          
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {currentTier.minPoints.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {nextTierData.nextTier.minPoints.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      {showBenefits && (
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Tier Benefits</span>
          </div>
          <ul className="space-y-1">
            {currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Tiers Preview */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">All Tiers</p>
        <div className="flex justify-between">
          {Object.values(TIER_SYSTEM).map((tier) => (
            <div 
              key={tier.tier}
              className={cn(
                "flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all",
                tier.tier === currentTier.tier 
                  ? "bg-primary/10 scale-110" 
                  : points >= tier.minPoints 
                    ? "opacity-100" 
                    : "opacity-40"
              )}
            >
              <span className="text-lg">{tier.icon}</span>
              <span className="text-[9px] font-medium truncate max-w-[40px]">
                {tier.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
