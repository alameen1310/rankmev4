import { cn } from '@/lib/utils';
import type { Tier } from '@/types';

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<Tier, { label: string; colors: string; icon: string }> = {
  bronze: {
    label: 'Bronze',
    colors: 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100',
    icon: '🥉',
  },
  silver: {
    label: 'Silver',
    colors: 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900',
    icon: '🥈',
  },
  gold: {
    label: 'Gold',
    colors: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-900 shadow-gold-glow',
    icon: '🥇',
  },
  platinum: {
    label: 'Platinum',
    colors: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
    icon: '💎',
  },
  diamond: {
    label: 'Diamond',
    colors: 'bg-gradient-to-br from-cyan-300 to-blue-400 text-blue-900 animate-pulse-slow',
    icon: '💠',
  },
  champion: {
    label: 'Champion',
    colors: 'gradient-champion text-white animate-glow',
    icon: '👑',
  },
};

const sizeClasses = {
  sm: 'h-5 px-2 text-xs gap-1',
  md: 'h-7 px-3 text-sm gap-1.5',
  lg: 'h-9 px-4 text-base gap-2',
};

export const TierBadge = ({ tier, size = 'md', showLabel = true, className }: TierBadgeProps) => {
  const config = tierConfig[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        config.colors,
        sizeClasses[size],
        className
      )}
    >
      <span className={size === 'lg' ? 'text-lg' : 'text-sm'}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
