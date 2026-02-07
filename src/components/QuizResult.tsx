import { useEffect, useState, useRef } from 'react';
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

// Simple count-up hook
const useCountUp = (target: number, duration: number, startDelay: number) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, startDelay]);

  return value;
};

export const QuizResult = ({ result, onRetry }: QuizResultProps) => {
  const navigate = useNavigate();
  const { submitResults } = useQuiz();
  const [phase, setPhase] = useState(0);

  // Submit results to database when component mounts
  useEffect(() => {
    submitResults();
  }, [submitResults]);

  // Phased reveal timing
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),    // Score count-up
      setTimeout(() => setPhase(2), 700),     // Grade badge
      setTimeout(() => setPhase(3), 1100),    // Stats grid
      setTimeout(() => setPhase(4), 1600),    // Comparison
      setTimeout(() => setPhase(5), 2000),    // CTA buttons
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animated counters
  const animatedPoints = useCountUp(result.totalPoints, 500, 100);
  const animatedAccuracy = useCountUp(Math.round(result.accuracy), 400, 800);

  const getGrade = () => {
    if (result.accuracy >= 90) return { label: 'A+', color: 'text-success', bg: 'from-success/20 to-success/5', border: 'border-success/40', message: 'Outstanding!' };
    if (result.accuracy >= 80) return { label: 'A', color: 'text-success', bg: 'from-success/20 to-success/5', border: 'border-success/30', message: 'Excellent!' };
    if (result.accuracy >= 70) return { label: 'B', color: 'text-primary', bg: 'from-primary/20 to-primary/5', border: 'border-primary/30', message: 'Great job!' };
    if (result.accuracy >= 60) return { label: 'C', color: 'text-warning', bg: 'from-warning/20 to-warning/5', border: 'border-warning/30', message: 'Good effort!' };
    return { label: 'D', color: 'text-destructive', bg: 'from-destructive/20 to-destructive/5', border: 'border-destructive/30', message: 'Keep practicing!' };
  };

  const grade = getGrade();
  const showConfetti = result.accuracy >= 80;

  // Comparison message
  const getComparison = () => {
    if (result.accuracy >= 90) return 'Top-tier performance! 🏆';
    if (result.accuracy >= 80) return 'Better than most players! 🎯';
    if (result.accuracy >= 70) return 'Solid round! Keep it up 💪';
    if (result.accuracy >= 60) return 'You\'re improving! Practice more 📚';
    return 'Every attempt makes you better! 🌱';
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4">
      <Confetti isActive={showConfetti && phase >= 2} />
      
      {/* Phase 1: Score Count-Up */}
      <div className={cn(
        "mb-2 transition-all duration-500",
        phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary tabular-nums">
            +{animatedPoints}
          </div>
          <div className="text-sm text-muted-foreground mt-1 font-medium">XP Earned</div>
        </div>
      </div>

      {/* Phase 2: Grade Badge */}
      <div className={cn(
        "relative mb-6 transition-all duration-500",
        phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-75"
      )}
      style={{ transitionDelay: phase >= 2 ? '0ms' : '0ms' }}
      >
        <div className={cn(
          "w-28 h-28 rounded-full flex items-center justify-center",
          `bg-gradient-to-br ${grade.bg}`,
          "border-4",
          grade.border,
        )}>
          <div className="text-center">
            <div className={cn("text-3xl font-bold", grade.color)}>
              {grade.label}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5 tabular-nums">
              {animatedAccuracy}%
            </div>
          </div>
        </div>
        
        {showConfetti && phase >= 2 && (
          <div className="absolute -top-2 -right-2">
            <span className="text-2xl animate-bounce-subtle">🎉</span>
          </div>
        )}
      </div>

      {/* Grade Message */}
      <h1 className={cn(
        "text-2xl font-bold mb-1 transition-all duration-400",
        phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}>
        {grade.message}
      </h1>
      <p className={cn(
        "text-muted-foreground mb-4 text-sm transition-all duration-400",
        phase >= 2 ? "opacity-100" : "opacity-0"
      )}>
        {result.correctAnswers} out of {result.totalQuestions} correct
      </p>

      {/* Phase 3: Stats Grid - staggered */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-4">
        {[
          { icon: Trophy, color: 'text-warning', value: `+${result.totalPoints}`, label: 'Points Earned', delay: 0 },
          { icon: Target, color: 'text-success', value: `${result.correctAnswers}/${result.totalQuestions}`, label: 'Correct', delay: 100 },
          { icon: Clock, color: 'text-primary', value: `${result.averageTime.toFixed(1)}s`, label: 'Avg. Time', delay: 200 },
          { icon: Zap, color: 'text-warning', value: `${result.perfectStreak}`, label: 'Best Streak', delay: 300 },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "glass rounded-xl p-3.5 text-center min-h-[90px] flex flex-col justify-center transition-all duration-400",
              phase >= 3 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
            )}
            style={{ transitionDelay: phase >= 3 ? `${stat.delay}ms` : '0ms' }}
          >
            <stat.icon className={cn("h-5 w-5 mx-auto mb-1.5", stat.color)} />
            <div className={cn("text-xl font-bold tabular-nums", stat.delay === 0 && stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Phase 4: Comparison Text */}
      <div className={cn(
        "mb-6 px-4 py-2.5 glass rounded-xl text-center transition-all duration-400",
        phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}>
        <p className="text-sm font-medium">{getComparison()}</p>
      </div>

      {/* Phase 5: CTA Actions */}
      <div className={cn(
        "flex gap-3 w-full max-w-xs transition-all duration-400",
        phase >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
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
