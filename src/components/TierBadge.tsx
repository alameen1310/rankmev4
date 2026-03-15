import { cn } from '@/lib/utils';
import type { Tier } from '@/types';

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<Tier, { label: string; bg: string; icon: string }> = {
  bronze: { label: 'Bronze', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: '🥉' },
  silver: { label: 'Silver', bg: 'bg-secondary text-secondary-foreground', icon: '🥈' },
  gold: { label: 'Gold', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: '🥇' },
  platinum: { label: 'Platinum', bg: 'bg-secondary text-secondary-foreground', icon: '💎' },
  diamond: { label: 'Diamond', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', icon: '💠' },
  champion: { label: 'Champion', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: '👑' },
};

const sizeClasses = {
  sm: 'h-5 px-1.5 text-[10px] gap-0.5',
  md: 'h-6 px-2 text-xs gap-1',
  lg: 'h-8 px-3 text-sm gap-1.5',
};

export const TierBadge = ({ tier, size = 'md', showLabel = true, className }: TierBadgeProps) => {
  const config = tierConfig[tier];

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-semibold',
      config.bg,
      sizeClasses[size],
      className
    )}>
      <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
