import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, Zap, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuizResult as QuizResultType } from '@/types';

interface QuizResultProps {
  result: QuizResultType;
  onRetry: () => void;
}

export const QuizResult = ({ result, onRetry }: QuizResultProps) => {
  const navigate = useNavigate();

  const getGrade = () => {
    if (result.accuracy >= 90) return { label: 'A+', color: 'text-success', message: 'Outstanding!' };
    if (result.accuracy >= 80) return { label: 'A', color: 'text-success', message: 'Excellent!' };
    if (result.accuracy >= 70) return { label: 'B', color: 'text-primary', message: 'Great job!' };
    if (result.accuracy >= 60) return { label: 'C', color: 'text-warning', message: 'Good effort!' };
    return { label: 'D', color: 'text-destructive', message: 'Keep practicing!' };
  };

  const grade = getGrade();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 animate-fade-in-up">
      {/* Score Circle */}
      <div className="relative mb-8">
        <div className={cn(
          "w-40 h-40 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "border-4 border-primary/30"
        )}>
          <div className="text-center">
            <div className={cn("text-5xl font-bold", grade.color)}>
              {grade.label}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(result.accuracy)}%
            </div>
          </div>
        </div>
        
        {result.accuracy >= 80 && (
          <div className="absolute -top-2 -right-2">
            <span className="text-4xl animate-bounce-subtle">🎉</span>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-2">{grade.message}</h1>
      <p className="text-muted-foreground mb-8">
        You got {result.correctAnswers} out of {result.totalQuestions} correct
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-warning" />
          <div className="text-2xl font-bold text-warning">
            +{result.totalPoints}
          </div>
          <div className="text-xs text-muted-foreground">Points Earned</div>
        </div>

        <div className="glass rounded-xl p-4 text-center">
          <Target className="h-6 w-6 mx-auto mb-2 text-success" />
          <div className="text-2xl font-bold">
            {result.correctAnswers}/{result.totalQuestions}
          </div>
          <div className="text-xs text-muted-foreground">Correct</div>
        </div>

        <div className="glass rounded-xl p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">
            {result.averageTime.toFixed(1)}s
          </div>
          <div className="text-xs text-muted-foreground">Avg. Time</div>
        </div>

        <div className="glass rounded-xl p-4 text-center">
          <Zap className="h-6 w-6 mx-auto mb-2 text-warning" />
          <div className="text-2xl font-bold">
            {result.perfectStreak}
          </div>
          <div className="text-xs text-muted-foreground">Best Streak</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 w-full max-w-sm">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate('/dashboard')}
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button
          variant="hero"
          className="flex-1"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
};
