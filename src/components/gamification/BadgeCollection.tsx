import { useState, useEffect } from 'react';
import { Trophy, Lock, Search, Filter } from 'lucide-react';
import { BADGES, RARITY_COLORS, type Badge } from '@/services/gamification';
import { getUserBadges, type UserBadge } from '@/services/badges';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface BadgeCollectionProps {
  className?: string;
  compact?: boolean;
}

type BadgeCategory = 'all' | Badge['category'];

export const BadgeCollection = ({ className, compact = false }: BadgeCollectionProps) => {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;
      
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
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}20` }}
                title={badge.name}
              >
                {badge.icon}
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
          
          return (
            <div
              key={badge.id}
              className={cn(
                "glass rounded-xl p-3 transition-all",
                isEarned 
                  ? "hover:scale-[1.02]" 
                  : "opacity-60 grayscale"
              )}
            >
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
                  
                  <span 
                    className="text-[9px] font-semibold uppercase mt-1 inline-block"
                    style={{ color: RARITY_COLORS[badge.rarity] }}
                  >
                    {badge.rarity}
                  </span>
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
