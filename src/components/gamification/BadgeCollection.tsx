import { useState, useEffect } from 'react';
import { Trophy, Lock, Search, Star, Crown, Sparkles, Check } from 'lucide-react';
import { BADGES, RARITY_COLORS, type Badge } from '@/services/gamification';
import { getUserBadges, type UserBadge } from '@/services/badges';
import { useBadgeShowcase } from '@/hooks/useBadgeShowcase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BadgeCollectionProps {
  className?: string;
  compact?: boolean;
  showShowcase?: boolean;
}

type BadgeCategory = 'all' | Badge['category'];

// Rarity glow effects
const RARITY_GLOW: Record<Badge['rarity'], string> = {
  common: '',
  uncommon: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]',
  rare: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  epic: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  legendary: 'shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse',
  mythic: 'shadow-[0_0_24px_rgba(239,68,68,0.7)] animate-pulse',
};

// Rarity icons
const RARITY_ICONS: Record<Badge['rarity'], string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
  mythic: '🔴',
};

export const BadgeCollection = ({ className, compact = false, showShowcase = true }: BadgeCollectionProps) => {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    showcaseBadges,
    isSelectionMode,
    toggleSelectionMode,
    toggleBadgeSelection,
    getShowcaseBadges,
    isInShowcase,
  } = useBadgeShowcase();

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const badges = await getUserBadges(user.id);
        setUserBadges(badges.map(b => b.badge.name.toLowerCase().replace(/\s+/g, '-')));
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  const categories: { id: BadgeCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'study', label: 'Study' },
    { id: 'time', label: 'Time' },
    { id: 'streak', label: 'Streak' },
    { id: 'subject', label: 'Subjects' },
    { id: 'social', label: 'Social' },
    { id: 'special', label: 'Special' },
  ];

  const filteredBadges = BADGES.filter(badge => {
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const earnedCount = BADGES.filter(b => userBadges.includes(b.id)).length;
  const progress = (earnedCount / BADGES.length) * 100;
  const showcasedBadges = getShowcaseBadges();

  if (compact) {
    // Compact view for profile/sidebar
    const recentBadges = BADGES.filter(b => userBadges.includes(b.id)).slice(0, 4);
    
    return (
      <div className={cn("glass rounded-xl p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="font-semibold text-sm">Badges</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {earnedCount}/{BADGES.length}
          </span>
        </div>
        
        <div className="flex gap-2">
          {recentBadges.length > 0 ? (
            recentBadges.map(badge => (
              <div
                key={badge.id}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-lg relative",
                  RARITY_GLOW[badge.rarity]
                )}
                style={{ 
                  backgroundColor: `${RARITY_COLORS[badge.rarity]}20`,
                  border: `2px solid ${RARITY_COLORS[badge.rarity]}40`,
                }}
                title={badge.name}
              >
                {badge.icon}
                {badge.rarity === 'mythic' && (
                  <Crown className="h-2.5 w-2.5 text-red-500 absolute -top-1 -right-1" />
                )}
                {badge.rarity === 'legendary' && (
                  <Star className="h-2.5 w-2.5 text-amber-500 absolute -top-1 -right-1 fill-amber-500" />
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Complete challenges to earn badges!</p>
          )}
          
          {earnedCount > 4 && (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
              +{earnedCount - 4}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Featured Badges Showcase */}
      {showShowcase && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Featured Badges</h3>
                <p className="text-[10px] text-muted-foreground">Select 3 to showcase on your profile</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isSelectionMode ? "default" : "outline"}
              onClick={toggleSelectionMode}
            >
              {isSelectionMode ? 'Done' : 'Edit'}
            </Button>
          </div>

          {/* Showcase Slots */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(slot => {
              const badge = showcasedBadges[slot];
              
              return (
                <div
                  key={slot}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                    badge 
                      ? `${RARITY_GLOW[badge.rarity]}`
                      : "border-2 border-dashed border-muted-foreground/20"
                  )}
                  style={badge ? {
                    backgroundColor: `${RARITY_COLORS[badge.rarity]}15`,
                    border: `2px solid ${RARITY_COLORS[badge.rarity]}50`,
                  } : undefined}
                >
                  {badge ? (
                    <>
                      <span className="text-3xl mb-1">{badge.icon}</span>
                      <span className="text-[10px] font-medium text-center truncate w-full">{badge.name}</span>
                      <span 
                        className="text-[8px] font-bold uppercase"
                        style={{ color: RARITY_COLORS[badge.rarity] }}
                      >
                        {badge.rarity}
                      </span>
                      {isSelectionMode && (
                        <button
                          onClick={() => toggleBadgeSelection(badge.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isSelectionMode ? 'Tap below' : 'Empty'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Badge Collection</h2>
              <p className="text-sm text-muted-foreground">
                {earnedCount} of {BADGES.length} unlocked
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-bold">{Math.round(progress)}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-warning to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Rarity Legend */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-2">Rarity Levels:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RARITY_ICONS).map(([rarity, icon]) => (
              <div 
                key={rarity}
                className="flex items-center gap-1 text-[10px]"
                style={{ color: RARITY_COLORS[rarity as Badge['rarity']] }}
              >
                <span>{icon}</span>
                <span className="capitalize font-medium">{rarity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredBadges.map(badge => {
          const isEarned = userBadges.includes(badge.id);
          const isShowcased = isInShowcase(badge.id);
          
          return (
            <div
              key={badge.id}
              onClick={() => isSelectionMode && isEarned && toggleBadgeSelection(badge.id)}
              className={cn(
                "glass rounded-xl p-3 transition-all relative",
                isEarned 
                  ? `hover:scale-[1.02] cursor-pointer ${RARITY_GLOW[badge.rarity]}` 
                  : "opacity-60 grayscale",
                isSelectionMode && isEarned && "ring-2 ring-primary/50",
                isShowcased && "ring-2 ring-warning"
              )}
              style={isEarned ? {
                border: `2px solid ${RARITY_COLORS[badge.rarity]}40`,
              } : undefined}
            >
              {/* Selection Indicator */}
              {isSelectionMode && isEarned && (
                <div className={cn(
                  "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  isShowcased 
                    ? "bg-warning text-warning-foreground" 
                    : "bg-muted"
                )}>
                  {isShowcased ? <Check className="h-3 w-3" /> : '+'}
                </div>
              )}

              {/* Rarity Crown/Star */}
              {isEarned && badge.rarity === 'mythic' && (
                <Crown className="h-4 w-4 text-red-500 absolute top-2 left-2 animate-pulse" />
              )}
              {isEarned && badge.rarity === 'legendary' && (
                <Star className="h-4 w-4 text-amber-500 absolute top-2 left-2 fill-amber-500" />
              )}

              <div className="flex items-start gap-3">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                    "transition-all",
                    isEarned && "shadow-md"
                  )}
                  style={{ 
                    backgroundColor: isEarned ? `${RARITY_COLORS[badge.rarity]}20` : undefined,
                  }}
                >
                  {isEarned ? badge.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h4 className={cn(
                      "text-sm font-semibold truncate",
                      !isEarned && "text-muted-foreground"
                    )}>
                      {badge.name}
                    </h4>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm">{RARITY_ICONS[badge.rarity]}</span>
                    <span 
                      className="text-[9px] font-bold uppercase"
                      style={{ color: RARITY_COLORS[badge.rarity] }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No badges found</p>
        </div>
      )}
    </div>
  );
};
