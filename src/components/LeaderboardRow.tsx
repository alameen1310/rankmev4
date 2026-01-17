import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { cn } from '@/lib/utils';
import { BADGES } from '@/services/gamification';
import { TITLES } from '@/services/gamification';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  className?: string;
  showBadges?: boolean;
}

export const LeaderboardRow = ({ entry, isCurrentUser, className, showBadges = true }: LeaderboardRowProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Don't navigate for demo/fallback entries (numeric IDs are mock data)
    if (entry.id && isNaN(Number(entry.id))) {
      navigate(`/user/${entry.id}`);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getChangeIcon = () => {
    if (entry.change === 'up') {
      return (
        <div className="flex items-center gap-0.5 text-success text-xs font-medium">
          <TrendingUp className="h-3 w-3" />
          <span>{entry.changeAmount}</span>
        </div>
      );
    }
    if (entry.change === 'down') {
      return (
        <div className="flex items-center gap-0.5 text-destructive text-xs font-medium">
          <TrendingDown className="h-3 w-3" />
          <span>{entry.changeAmount}</span>
        </div>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Get title display
  const getEquippedTitle = () => {
    if (!entry.equippedTitle) return null;
    const title = TITLES.find(t => t.name === entry.equippedTitle || t.id === entry.equippedTitle);
    return title;
  };

  // Get showcase badges
  const getShowcaseBadges = () => {
    if (!entry.showcaseBadges || entry.showcaseBadges.length === 0) return [];
    return entry.showcaseBadges
      .map(badgeId => BADGES.find(b => b.id === badgeId || b.name.toLowerCase().replace(/\s+/g, '-') === badgeId))
      .filter(Boolean)
      .slice(0, 3);
  };

  const equippedTitle = getEquippedTitle();
  const showcaseBadges = getShowcaseBadges();
  const isClickable = entry.id && isNaN(Number(entry.id));
  
  return (
    <div
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 touch-target",
        isCurrentUser 
          ? "bg-primary/10 dark:bg-primary/15 border-2 border-primary/30" 
          : "glass hover:bg-accent/50 active:scale-[0.99]",
        entry.rank <= 3 && !isCurrentUser && "bg-gradient-to-r from-warning/5 to-transparent",
        isClickable && "cursor-pointer",
        className
      )}
    >
      {/* Rank */}
      <div className="w-10 flex justify-center shrink-0">
        {getRankDisplay(entry.rank)}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0 border-2 border-border">
        {entry.avatar && <AvatarImage src={entry.avatar} alt={entry.username} />}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {entry.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* User Info - With proper truncation */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold truncate max-w-[100px]",
            isCurrentUser && "text-primary"
          )}>
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
              YOU
            </span>
          )}
          {/* Equipped Title */}
          {equippedTitle && (
            <span className="shrink-0 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
              <span>{equippedTitle.icon}</span>
              <span className="hidden sm:inline truncate max-w-[60px]">{equippedTitle.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="shrink-0">{entry.countryFlag}</span>
          <TierBadge tier={entry.tier} size="sm" showLabel={false} />
          {/* Showcase Badges - inline mini display */}
          {showBadges && showcaseBadges.length > 0 && (
            <div className="flex items-center gap-0.5 ml-1">
              {showcaseBadges.map((badge, idx) => (
                <span 
                  key={idx} 
                  className="text-xs" 
                  title={badge?.name}
                >
                  {badge?.icon}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Points & Change */}
      <div className="text-right shrink-0">
        <div className="font-bold text-sm">{entry.points.toLocaleString()}</div>
        <div className="flex justify-end mt-0.5">{getChangeIcon()}</div>
      </div>
    </div>
  );
};
