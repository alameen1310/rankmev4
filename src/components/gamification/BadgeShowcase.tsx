import { useState, useEffect } from 'react';
import { Star, Check, X, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BADGES, RARITY_COLORS } from '@/services/gamification';
import { useGameState } from '@/contexts/GameStateContext';
import { getUserBadges, type UserBadge } from '@/services/badges';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface BadgeShowcaseProps {
  className?: string;
  editable?: boolean;
  userId?: string;
}

export const BadgeShowcase = ({ className, editable = false, userId }: BadgeShowcaseProps) => {
  const { state, setShowcaseBadges } = useGameState();
  const { user } = useAuth();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(state.showcaseBadges);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch earned badges from database
  useEffect(() => {
    const fetchBadges = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const badges = await getUserBadges(targetUserId);
        setEarnedBadges(badges);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [userId, user?.id]);

  // Sync temp selection with state when entering selection mode
  useEffect(() => {
    if (isSelectionMode) {
      setTempSelection(state.showcaseBadges);
    }
  }, [isSelectionMode, state.showcaseBadges]);

  const toggleBadgeSelection = (badgeId: string) => {
    if (tempSelection.includes(badgeId)) {
      setTempSelection(prev => prev.filter(id => id !== badgeId));
    } else {
      if (tempSelection.length >= 3) {
        toast({
          title: "Maximum 3 badges",
          description: "Remove one badge before adding another",
          variant: "destructive",
        });
        return;
      }
      setTempSelection(prev => [...prev, badgeId]);
    }
  };

  const saveSelection = () => {
    setShowcaseBadges(tempSelection);
    setIsSelectionMode(false);
    toast({
      title: "Showcase Updated!",
      description: "Your featured badges are now public",
    });
  };

  const cancelSelection = () => {
    setTempSelection(state.showcaseBadges);
    setIsSelectionMode(false);
  };

  // Map earned database badges to display format
  const displayableEarnedBadges = earnedBadges.map(ub => {
    // Try to match with local BADGES for icon and rarity
    const localBadge = BADGES.find(b => 
      b.name.toLowerCase() === ub.badge.name.toLowerCase() ||
      b.id === ub.badge.name.toLowerCase().replace(/\s+/g, '-')
    );
    return {
      id: ub.badge.name.toLowerCase().replace(/\s+/g, '-'),
      name: ub.badge.name,
      icon: localBadge?.icon || ub.badge.icon || '🏆',
      rarity: localBadge?.rarity || 'common',
      description: ub.badge.description,
    };
  });

  // Get showcase badges to display
  const showcaseBadges = (isSelectionMode ? tempSelection : state.showcaseBadges)
    .map(id => {
      const fromDb = displayableEarnedBadges.find(b => b.id === id);
      if (fromDb) return fromDb;
      // Fallback to local BADGES
      return BADGES.find(b => b.id === id);
    })
    .filter(Boolean);

  return (
    <div className={cn("glass rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning fill-warning" />
          <h3 className="font-semibold">Featured Badges</h3>
        </div>
        {editable && (
          <div className="flex gap-2">
            {isSelectionMode ? (
              <>
                <Button size="sm" variant="ghost" onClick={cancelSelection}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={saveSelection}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsSelectionMode(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Showcase Display */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[0, 1, 2].map(slot => {
          const badge = showcaseBadges[slot];
          
          return (
            <div
              key={slot}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all relative",
                badge 
                  ? "bg-gradient-to-br from-card to-accent/50" 
                  : "border-2 border-dashed border-muted-foreground/20",
                isSelectionMode && badge && "ring-2 ring-primary cursor-pointer"
              )}
              onClick={() => isSelectionMode && badge && toggleBadgeSelection(badge.id)}
            >
              {badge ? (
                <>
                  <span className="text-3xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] font-medium text-center line-clamp-1">{badge.name}</span>
                  <span 
                    className="text-[8px] font-bold uppercase mt-0.5"
                    style={{ color: RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF' }}
                  >
                    {badge.rarity}
                  </span>
                  {isSelectionMode && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {isSelectionMode ? 'Select badge' : 'Empty'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Badge Selection Grid */}
      {isSelectionMode && (
        <div className="pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium mb-3">Your Badges ({displayableEarnedBadges.length})</h4>
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading badges...</div>
          ) : displayableEarnedBadges.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {displayableEarnedBadges.map(badge => {
                const isSelected = tempSelection.includes(badge.id);
                
                return (
                  <button
                    key={badge.id}
                    onClick={() => toggleBadgeSelection(badge.id)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all",
                      "hover:bg-accent/50 relative",
                      isSelected && "ring-2 ring-primary bg-primary/10"
                    )}
                    style={{ 
                      boxShadow: isSelected ? `0 0 10px ${RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}40` : 'none'
                    }}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Complete quizzes to earn badges!
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Select up to 3 badges to display on your public profile
          </p>
        </div>
      )}

      {!isSelectionMode && showcaseBadges.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {editable ? "Tap 'Edit' to showcase your badges" : "No badges displayed"}
        </p>
      )}
    </div>
  );
};
