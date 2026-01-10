import { useState, useEffect } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RARITY_COLORS, type Badge } from '@/services/gamification';
import { Confetti } from '@/components/Confetti';

interface AchievementPopupProps {
  badge: Badge | null;
  onClose: () => void;
}

export const AchievementPopup = ({ badge, onClose }: AchievementPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
      setShowConfetti(true);

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [badge]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowConfetti(false);
      onClose();
    }, 300);
  };

  if (!badge) return null;

  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50",
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      >
        <div 
          className={cn(
            "relative bg-card rounded-3xl p-6 max-w-sm w-full text-center",
            "shadow-2xl border border-border/50",
            "transform transition-all duration-500",
            isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Sparkle Effects */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <Sparkles className="absolute top-4 left-8 h-6 w-6 text-warning animate-pulse" />
            <Sparkles className="absolute top-12 right-12 h-4 w-4 text-primary animate-pulse delay-75" />
            <Sparkles className="absolute bottom-16 left-12 h-5 w-5 text-warning animate-pulse delay-150" />
          </div>

          {/* Trophy Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center animate-bounce-slow"
                style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}20` }}
              >
                <span className="text-5xl">{badge.icon}</span>
              </div>
              <div 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                style={{ 
                  backgroundColor: RARITY_COLORS[badge.rarity],
                  color: badge.rarity === 'legendary' || badge.rarity === 'mythic' ? 'black' : 'white'
                }}
              >
                {badge.rarity}
              </div>
            </div>
          </div>

          {/* Achievement Text */}
          <div className="space-y-2 mb-6">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              Achievement Unlocked!
            </p>
            <h2 className="text-2xl font-bold">{badge.name}</h2>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-white",
              "transition-all hover:opacity-90"
            )}
            style={{ backgroundColor: RARITY_COLORS[badge.rarity] }}
          >
            Awesome!
          </button>
        </div>
      </div>
    </>
  );
};

// Hook for managing achievement popups
import { createContext, useContext, ReactNode, useCallback } from 'react';

interface AchievementContextType {
  showAchievement: (badge: Badge) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [queue, setQueue] = useState<Badge[]>([]);

  const showAchievement = useCallback((badge: Badge) => {
    if (currentBadge) {
      // Add to queue if something is already showing
      setQueue(prev => [...prev, badge]);
    } else {
      setCurrentBadge(badge);
    }
  }, [currentBadge]);

  const handleClose = useCallback(() => {
    setCurrentBadge(null);
    
    // Show next in queue if any
    if (queue.length > 0) {
      setTimeout(() => {
        setCurrentBadge(queue[0]);
        setQueue(prev => prev.slice(1));
      }, 300);
    }
  }, [queue]);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementPopup badge={currentBadge} onClose={handleClose} />
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider');
  }
  return context;
};
