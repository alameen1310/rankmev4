import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Flame, Skull, ArrowRight, Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { QUIZ_MODES, type QuizModeType } from '@/types/quiz-modes';

interface QuizModeSelectorProps {
  onModeSelect: (mode: QuizModeType) => void;
  className?: string;
}

const modeIcons: Record<QuizModeType, React.ReactNode> = {
  'quick-play': <Zap className="w-6 h-6" />,
  'focus-drill': <Target className="w-6 h-6" />,
  'time-attack': <Flame className="w-6 h-6" />,
  'survival': <Skull className="w-6 h-6" />,
};

export function QuizModeSelector({ onModeSelect, className }: QuizModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<QuizModeType | null>(null);
  const [hoveredMode, setHoveredMode] = useState<QuizModeType | null>(null);

  const handleModeClick = (mode: QuizModeType) => {
    setSelectedMode(mode);
  };

  const handleStart = () => {
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  const displayMode = hoveredMode || selectedMode;
  const displayConfig = displayMode ? QUIZ_MODES[displayMode] : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.values(QUIZ_MODES).map((mode) => (
          <Card
            key={mode.id}
            onClick={() => handleModeClick(mode.id)}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            className={cn(
              "relative p-4 cursor-pointer transition-all duration-200 overflow-hidden group",
              selectedMode === mode.id
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {/* Gradient Background */}
            <div 
              className={cn(
                "absolute inset-0 opacity-0 transition-opacity duration-300",
                `bg-gradient-to-br ${mode.color}`,
                selectedMode === mode.id && "opacity-10",
                "group-hover:opacity-5"
              )}
            />
            
            {/* XP Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-success/20 text-success border-success/30"
            >
              <Star className="w-2.5 h-2.5 mr-0.5" />
              XP
            </Badge>

            <div className="relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                `bg-gradient-to-br ${mode.color} text-white`
              )}>
                {modeIcons[mode.id]}
              </div>
              
              <h3 className="font-bold text-sm mb-1">{mode.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {mode.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Mode Details */}
      {displayConfig && (
        <Card className="p-4 bg-muted/50 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br ${displayConfig.color} text-white`
            )}>
              {modeIcons[displayConfig.id]}
            </div>
            <div>
              <h3 className="font-bold">{displayConfig.name}</h3>
              <p className="text-xs text-muted-foreground">{displayConfig.description}</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displayConfig.features.map((feature, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5">
                {feature}
              </Badge>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-primary">
                {typeof displayConfig.questionCount === 'number' 
                  ? displayConfig.questionCount === 999 ? '∞' : displayConfig.questionCount
                  : `${displayConfig.questionCount.min}-${displayConfig.questionCount.max}`}
              </div>
              <div className="text-muted-foreground">Questions</div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-primary">
                {displayConfig.globalTimer 
                  ? `${displayConfig.globalTimer}s`
                  : displayConfig.timePerQuestion 
                    ? `${displayConfig.timePerQuestion}s`
                    : 'None'}
              </div>
              <div className="text-muted-foreground">
                {displayConfig.globalTimer ? 'Total' : 'Per Q'}
              </div>
            </div>
            <div className="bg-background rounded-lg p-2">
              <div className="font-bold text-success flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3" />
                XP
              </div>
              <div className="text-muted-foreground">Reward</div>
            </div>
          </div>
        </Card>
      )}

      {/* Start Button */}
      <Button
        onClick={handleStart}
        disabled={!selectedMode}
        className="w-full h-12 text-base font-bold"
        size="lg"
      >
        {selectedMode ? (
          <>
            Start {QUIZ_MODES[selectedMode].name}
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        ) : (
          'Select a Mode'
        )}
      </Button>
    </div>
  );
}
