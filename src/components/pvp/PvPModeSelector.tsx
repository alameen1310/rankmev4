import { useState } from 'react';
import { Handshake, Swords, Zap, ArrowRight, Star, Trophy, Lock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PVP_MODES, type PvPModeType } from '@/types/quiz-modes';

interface PvPModeSelectorProps {
  onModeSelect: (mode: PvPModeType) => void;
  rankedMatchesToday?: number;
  className?: string;
}

const modeIcons: Record<PvPModeType, React.ReactNode> = {
  'casual-duel': <Handshake className="w-6 h-6" />,
  'ranked-duel': <Swords className="w-6 h-6" />,
  'race-mode': <Zap className="w-6 h-6" />,
};

export function PvPModeSelector({ onModeSelect, rankedMatchesToday = 0, className }: PvPModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<PvPModeType | null>(null);
  const [hoveredMode, setHoveredMode] = useState<PvPModeType | null>(null);

  const handleModeClick = (mode: PvPModeType) => {
    const config = PVP_MODES[mode];
    
    // Check ranked daily limit
    if (mode === 'ranked-duel' && config.dailyLimit && rankedMatchesToday >= config.dailyLimit) {
      return; // Disabled
    }
    
    setSelectedMode(mode);
  };

  const handleStart = () => {
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  const displayMode = hoveredMode || selectedMode;
  const displayConfig = displayMode ? PVP_MODES[displayMode] : null;
  
  const rankedLimit = PVP_MODES['ranked-duel'].dailyLimit || 3;
  const isRankedLocked = rankedMatchesToday >= rankedLimit;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Grid */}
      <div className="space-y-3">
        {Object.values(PVP_MODES).map((mode) => {
          const isLocked = mode.id === 'ranked-duel' && isRankedLocked;
          
          return (
            <Card
              key={mode.id}
              onClick={() => !isLocked && handleModeClick(mode.id)}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
              className={cn(
                "relative p-4 cursor-pointer transition-all duration-200 overflow-hidden",
                isLocked && "opacity-50 cursor-not-allowed",
                selectedMode === mode.id && !isLocked
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : !isLocked && "hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {/* Gradient Background */}
              <div 
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  `bg-gradient-to-br ${mode.color}`,
                  selectedMode === mode.id && !isLocked && "opacity-10"
                )}
              />
              
              {/* Reward Badge */}
              <Badge 
                variant="secondary" 
                className={cn(
                  "absolute top-3 right-3 text-[10px] px-1.5 py-0.5",
                  mode.rewardType === 'rank' 
                    ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                    : "bg-success/20 text-success border-success/30"
                )}
              >
                {mode.rewardType === 'rank' ? (
                  <>
                    <Trophy className="w-2.5 h-2.5 mr-0.5" />
                    RANK
                  </>
                ) : (
                  <>
                    <Star className="w-2.5 h-2.5 mr-0.5" />
                    XP
                  </>
                )}
              </Badge>

              <div className="relative z-10 flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                  `bg-gradient-to-br ${mode.color} text-white`,
                  isLocked && "grayscale"
                )}>
                  {isLocked ? <Lock className="w-6 h-6" /> : modeIcons[mode.id]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{mode.name}</h3>
                    {mode.dailyLimit && (
                      <span className="text-xs text-muted-foreground">
                        ({rankedMatchesToday}/{mode.dailyLimit} today)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {mode.description}
                  </p>
                  
                  {/* Quick Features */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mode.features.slice(0, 2).map((feature, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <Lock className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Daily limit reached</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Ranked Warning */}
      {selectedMode === 'ranked-duel' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Ranked Mode</p>
            <p className="text-xs opacity-80">
              This affects your rank on the leaderboard. You have {rankedLimit - rankedMatchesToday} matches remaining today.
            </p>
          </div>
        </div>
      )}

      {/* Selected Mode Details */}
      {displayConfig && (
        <Card className="p-4 bg-muted/50 animate-fade-in">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-primary">{displayConfig.questionCount}</div>
              <div className="text-muted-foreground">Questions</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-primary">{displayConfig.timePerQuestion}s</div>
              <div className="text-muted-foreground">Per Q</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-primary">
                {displayConfig.allowSubjectSelection ? 'Yes' : 'No'}
              </div>
              <div className="text-muted-foreground">Pick Subject</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className={cn(
                "font-bold flex items-center justify-center gap-0.5",
                displayConfig.rewardType === 'rank' ? 'text-yellow-500' : 'text-success'
              )}>
                {displayConfig.rewardType === 'rank' ? (
                  <><Trophy className="w-3 h-3" /> Rank</>
                ) : (
                  <><Star className="w-3 h-3" /> XP</>
                )}
              </div>
              <div className="text-muted-foreground">Reward</div>
            </div>
          </div>
        </Card>
      )}

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={!selectedMode || (selectedMode === 'ranked-duel' && isRankedLocked)}
        className="w-full h-12 text-base font-bold"
        size="lg"
      >
        {selectedMode ? (
          <>
            {selectedMode === 'ranked-duel' ? 'Find Ranked Match' : 'Find Opponent'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        ) : (
          'Select a Mode'
        )}
      </Button>
    </div>
  );
}
