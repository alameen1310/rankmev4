import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, Zap, RotateCcw, Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/Confetti';
import { cn } from '@/lib/utils';
import { useQuiz } from '@/contexts/QuizContext';
import type { QuizResult as QuizResultType } from '@/types';

interface QuizResultProps {
  result: QuizResultType;
  onRetry: () => void;
}

export const QuizResult = ({ result, onRetry }: QuizResultProps) => {
  const navigate = useNavigate();
  const { submitResults } = useQuiz();

  // Submit results to database when component mounts
  useEffect(() => {
    submitResults();
  }, [submitResults]);

  const getGrade = () => {
    if (result.accuracy >= 90) return { label: 'A+', color: 'text-success', bg: 'from-success/20 to-success/5', message: 'Outstanding!' };
    if (result.accuracy >= 80) return { label: 'A', color: 'text-success', bg: 'from-success/20 to-success/5', message: 'Excellent!' };
    if (result.accuracy >= 70) return { label: 'B', color: 'text-primary', bg: 'from-primary/20 to-primary/5', message: 'Great job!' };
    if (result.accuracy >= 60) return { label: 'C', color: 'text-warning', bg: 'from-warning/20 to-warning/5', message: 'Good effort!' };
    return { label: 'D', color: 'text-destructive', bg: 'from-destructive/20 to-destructive/5', message: 'Keep practicing!' };
  };

  const grade = getGrade();
  const showConfetti = result.accuracy >= 80;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 animate-fade-in-up">
      <Confetti isActive={showConfetti} />
      
      {/* Score Circle */}
      <div className="relative mb-6">
        <div className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center",
          `bg-gradient-to-br ${grade.bg}`,
          "border-4 border-current",
          grade.color.replace('text-', 'border-')
        )}>
          <div className="text-center">
            <div className={cn("text-4xl font-bold", grade.color)}>
              {grade.label}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {Math.round(result.accuracy)}%
            </div>
          </div>
        </div>
        
        {showConfetti && (
          <div className="absolute -top-2 -right-2">
            <span className="text-3xl animate-bounce-subtle">🎉</span>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-1">{grade.message}</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {result.correctAnswers} out of {result.totalQuestions} correct
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
        <div className="glass rounded-xl p-3.5 text-center min-h-[90px] flex flex-col justify-center">
          <Trophy className="h-5 w-5 mx-auto mb-1.5 text-warning" />
          <div className="text-xl font-bold text-warning">
            +{result.totalPoints}
          </div>
          <div className="text-[10px] text-muted-foreground">Points Earned</div>
        </div>

        <div className="glass rounded-xl p-3.5 text-center min-h-[90px] flex flex-col justify-center">
          <Target className="h-5 w-5 mx-auto mb-1.5 text-success" />
          <div className="text-xl font-bold">
            {result.correctAnswers}/{result.totalQuestions}
          </div>
          <div className="text-[10px] text-muted-foreground">Correct</div>
        </div>

        <div className="glass rounded-xl p-3.5 text-center min-h-[90px] flex flex-col justify-center">
          <Clock className="h-5 w-5 mx-auto mb-1.5 text-primary" />
          <div className="text-xl font-bold">
            {result.averageTime.toFixed(1)}s
          </div>
          <div className="text-[10px] text-muted-foreground">Avg. Time</div>
        </div>

        <div className="glass rounded-xl p-3.5 text-center min-h-[90px] flex flex-col justify-center">
          <Zap className="h-5 w-5 mx-auto mb-1.5 text-warning" />
          <div className="text-xl font-bold">
            {result.perfectStreak}
          </div>
          <div className="text-[10px] text-muted-foreground">Best Streak</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          className="flex-1 h-11 touch-target"
          onClick={() => navigate('/dashboard')}
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button
          variant="outline"
          className="h-11 px-4 touch-target"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          className="flex-1 h-11 touch-target"
          onClick={onRetry}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
};