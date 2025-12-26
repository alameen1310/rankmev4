import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  className?: string;
}

export const LeaderboardRow = ({ entry, isCurrentUser, className }: LeaderboardRowProps) => {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getChangeIcon = () => {
    if (entry.change === 'up') {
      return (
        <div className="flex items-center gap-0.5 text-success text-xs">
          <TrendingUp className="h-3 w-3" />
          <span>{entry.changeAmount}</span>
        </div>
      );
    }
    if (entry.change === 'down') {
      return (
        <div className="flex items-center gap-0.5 text-destructive text-xs">
          <TrendingDown className="h-3 w-3" />
          <span>{entry.changeAmount}</span>
        </div>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        isCurrentUser 
          ? "bg-primary/10 border-2 border-primary/30 shadow-glow" 
          : "glass hover:bg-accent/50",
        entry.rank <= 3 && "bg-gradient-to-r from-warning/5 to-transparent",
        className
      )}
    >
      <div className="w-12 flex justify-center">
        {getRankDisplay(entry.rank)}
      </div>

      <Avatar className="h-10 w-10 border-2 border-border">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold truncate",
            isCurrentUser && "text-primary"
          )}>
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{entry.countryFlag}</span>
          <TierBadge tier={entry.tier} size="sm" showLabel={false} />
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold">{entry.points.toLocaleString()}</div>
        <div className="flex justify-end">{getChangeIcon()}</div>
      </div>
    </div>
  );
};
