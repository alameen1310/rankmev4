import { useState, useEffect } from 'react';
import { Target, Filter, Trophy, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { 
  CHALLENGE_BADGES, 
  MYSTERY_BOX_EXCLUSIVES,
  DIFFICULTY_CONFIG,
  getChallengeProgress,
  isChallengeCompleted,
  type ChallengeBadge,
  type ChallengeDifficulty,
} from '@/services/challengeBadges';
import { RARITY_COLORS } from '@/services/gamification';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ChallengeTrackerProps {
  className?: string;
}

type FilterType = 'all' | ChallengeDifficulty;

// Rarity glow effects
const RARITY_GLOW: Record<ChallengeBadge['rarity'], string> = {
  common: '',
  uncommon: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]',
  rare: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  epic: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  legendary: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
  mythic: 'shadow-[0_0_24px_rgba(239,68,68,0.7)] animate-pulse',
};

export const ChallengeTracker = ({ className }: ChallengeTrackerProps) => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showExclusives, setShowExclusives] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, number>>({});

  // Load challenge progress
  useEffect(() => {
    const progress: Record<string, number> = {};
    
    CHALLENGE_BADGES.forEach(badge => {
      // Calculate progress based on badge type
      switch (badge.challenge.type) {
        case 'streak':
          progress[badge.id] = profile?.current_streak || 0;
          break;
        case 'quiz':
        case 'quantity':
          progress[badge.id] = profile?.total_quizzes_completed || 0;
          break;
        case 'accuracy':
          // Count perfect scores (simplified - would need real data)
          progress[badge.id] = getChallengeProgress(badge.id);
          break;
        case 'social':
          progress[badge.id] = getChallengeProgress(badge.id);
          break;
        default:
          progress[badge.id] = getChallengeProgress(badge.id);
      }
    });
    
    setChallengeProgress(progress);
  }, [profile]);

  const filters: { id: FilterType; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'easy', label: 'Easy', icon: '⭐' },
    { id: 'medium', label: 'Medium', icon: '⭐⭐' },
    { id: 'hard', label: 'Hard', icon: '⭐⭐⭐' },
    { id: 'extreme', label: 'Extreme', icon: '💀' },
  ];

  const filteredChallenges = filter === 'all' 
    ? CHALLENGE_BADGES 
    : CHALLENGE_BADGES.filter(b => b.difficulty === filter);

  const completedCount = CHALLENGE_BADGES.filter(b => {
    const progress = challengeProgress[b.id] || 0;
    return progress >= b.challenge.requirement;
  }).length;

  const overallProgress = (completedCount / CHALLENGE_BADGES.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Stats */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Challenges</h2>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {CHALLENGE_BADGES.length} completed
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-bold">{Math.round(overallProgress)}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <Progress value={overallProgress} className="h-2" />
        
        {/* Difficulty Legend */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground mb-2">Difficulty Levels:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
              <div 
                key={key}
                className="flex items-center gap-1 text-[10px]"
                style={{ color: config.color }}
              >
                <span>{config.icon}</span>
                <span className="capitalize font-medium">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              "flex items-center gap-1",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Challenge Cards */}
      <div className="space-y-3">
        {filteredChallenges.map(badge => {
          const progress = challengeProgress[badge.id] || 0;
          const isCompleted = progress >= badge.challenge.requirement;
          const progressPercent = Math.min((progress / badge.challenge.requirement) * 100, 100);
          const diffConfig = DIFFICULTY_CONFIG[badge.difficulty];

          return (
            <div
              key={badge.id}
              className={cn(
                "glass rounded-xl p-4 transition-all",
                isCompleted && RARITY_GLOW[badge.rarity],
                isCompleted && "ring-2 ring-success/50"
              )}
              style={isCompleted ? {
                border: `2px solid ${RARITY_COLORS[badge.rarity]}40`,
              } : undefined}
            >
              <div className="flex items-start gap-3">
                {/* Badge Icon */}
                <div 
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0",
                    isCompleted ? "shadow-md" : "opacity-60 grayscale"
                  )}
                  style={{ 
                    backgroundColor: isCompleted 
                      ? `${RARITY_COLORS[badge.rarity]}20` 
                      : 'var(--muted)',
                  }}
                >
                  {isCompleted ? badge.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{badge.name}</h4>
                    <span 
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                      style={{ 
                        backgroundColor: `${diffConfig.color}20`,
                        color: diffConfig.color,
                      }}
                    >
                      {diffConfig.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {badge.challenge.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {progress} / {badge.challenge.requirement} {badge.challenge.unit}
                      </span>
                      <span className="font-medium">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isCompleted ? "bg-success" : "bg-primary"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span 
                        className="font-bold uppercase"
                        style={{ color: RARITY_COLORS[badge.rarity] }}
                      >
                        {badge.rarity}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-warning font-medium">
                        +{badge.reward.points} pts
                      </span>
                    </div>
                    
                    {badge.reward.specialEffect && (
                      <div className="flex items-center gap-1 text-[10px] text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>{badge.reward.specialEffect}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mystery Box Exclusives Toggle */}
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setShowExclusives(!showExclusives)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🎁</span>
          <span>Mystery Box Exclusives</span>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          showExclusives && "rotate-90"
        )} />
      </Button>

      {/* Mystery Box Exclusives List */}
      {showExclusives && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground text-center">
            These ultra-rare badges can only be obtained from Mystery Boxes!
          </p>
          
          {MYSTERY_BOX_EXCLUSIVES.map(badge => (
            <div
              key={badge.id}
              className={cn(
                "glass rounded-xl p-4 opacity-75",
                RARITY_GLOW[badge.rarity]
              )}
              style={{
                border: `2px solid ${RARITY_COLORS[badge.rarity]}40`,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl opacity-50"
                  style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}20` }}
                >
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{badge.name}</h4>
                    <span 
                      className="text-[9px] font-bold uppercase animate-pulse"
                      style={{ color: RARITY_COLORS[badge.rarity] }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {badge.challenge.description}
                  </p>
                  {badge.reward.specialEffect && (
                    <p className="text-[10px] text-primary mt-1">
                      ✨ {badge.reward.specialEffect}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredChallenges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No challenges found for this filter</p>
        </div>
      )}
    </div>
  );
};
