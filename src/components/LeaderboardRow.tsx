import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  className?: string;
}

export const LeaderboardRow = ({ entry, isCurrentUser, className }: LeaderboardRowProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (entry.id && isNaN(Number(entry.id))) {
      navigate(`/user/${entry.id}`);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getChangeIcon = () => {
    if (entry.change === 'up') {
      return (
        <span className="flex items-center gap-0.5 text-success text-xs font-medium">
          <TrendingUp className="h-3 w-3" />
          {entry.changeAmount}
        </span>
      );
    }
    if (entry.change === 'down') {
      return (
        <span className="flex items-center gap-0.5 text-destructive text-xs font-medium">
          <TrendingDown className="h-3 w-3" />
          {entry.changeAmount}
        </span>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const isClickable = entry.id && isNaN(Number(entry.id));

  return (
    <div
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        isCurrentUser
          ? "bg-primary/8 border border-primary/20"
          : "bg-card border border-border hover:bg-accent/50",
        isClickable && "cursor-pointer",
        className
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center shrink-0">
        {getRankDisplay(entry.rank)}
      </div>

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        {entry.avatar && <AvatarImage src={entry.avatar} alt={entry.username} />}
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-semibold text-sm truncate", isCurrentUser && "text-primary")}>
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{entry.countryFlag}</span>
          <TierBadge tier={entry.tier} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <div className="font-bold text-sm">{entry.points.toLocaleString()}</div>
        <div className="flex justify-end mt-0.5">{getChangeIcon()}</div>
      </div>
    </div>
  );
};
