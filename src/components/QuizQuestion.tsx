import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { FloatingScore } from '@/components/quiz/FloatingScore';
import { StreakIndicator } from '@/components/quiz/StreakIndicator';
import type { Question } from '@/types';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionIndex: number, timeSpent: number) => void;
  timeLimit?: number;
  currentStreak?: number;
}

export const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timeLimit = 30,
  currentStreak = 0,
}: QuizQuestionProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showFloatingScore, setShowFloatingScore] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [comboText, setComboText] = useState<string | undefined>();
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelectedOption(null);
    setShowResult(false);
    setShowFloatingScore(false);
    setShowStreak(false);
    setEarnedPoints(0);
    setSpeedBonus(0);
    setComboText(undefined);
  }, [question.id, timeLimit]);

  useEffect(() => {
    if (showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleOptionSelect(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id, showResult]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (selectedOption !== null) return;

    const timeSpent = timeLimit - timeLeft;
    setSelectedOption(optionIndex);
    setShowResult(true);

    const isCorrect = optionIndex === question.correctIndex;

    if (isCorrect) {
      // Calculate points and bonuses
      const bonus = Math.max(0, Math.floor((30 - timeSpent) / 30 * 50));
      const total = question.points + bonus;
      setEarnedPoints(total);
      setSpeedBonus(bonus > 15 ? bonus : 0);

      // Combo text based on streak (streak includes this answer)
      const newStreak = currentStreak + 1;
      if (timeSpent < 5) {
        setComboText('⚡ LIGHTNING!');
      } else if (timeSpent < 10) {
        setComboText('🚀 FAST!');
      } else if (newStreak >= 3) {
        setComboText(`${newStreak}x COMBO!`);
      }

      // Show floating score
      setTimeout(() => setShowFloatingScore(true), 200);

      // Show streak indicator for 3+ streaks
      if (newStreak >= 3) {
        setTimeout(() => setShowStreak(true), 400);
      }
    }

    setTimeout(() => {
      onAnswer(optionIndex, timeSpent);
    }, 1400);
  }, [selectedOption, timeLimit, timeLeft, onAnswer, question.correctIndex, question.points, currentStreak]);

  const getOptionClassName = (index: number) => {
    const baseClasses = "relative p-4 rounded-xl text-left transition-all duration-200 touch-target w-full";
    
    if (!showResult) {
      return cn(
        baseClasses,
        "glass hover:bg-primary/10 hover:border-primary/30",
        "active:scale-[0.97] active:transition-transform active:duration-75"
      );
    }

    if (index === question.correctIndex) {
      return cn(
        baseClasses,
        "bg-success/15 border-2 border-success animate-correct-glow"
      );
    }

    if (index === selectedOption && index !== question.correctIndex) {
      return cn(
        baseClasses,
        "bg-destructive/15 border-2 border-destructive animate-shake"
      );
    }

    return cn(baseClasses, "glass opacity-40");
  };

  const timePercentage = (timeLeft / timeLimit) * 100;
  const isLowTime = timeLeft <= 10;
  const isMidTime = timeLeft <= timeLimit / 2;

  return (
    <div ref={questionRef} className="space-y-5">
      {/* Streak Indicator Overlay */}
      <StreakIndicator streak={currentStreak + (selectedOption === question.correctIndex ? 1 : 0)} show={showStreak} />

      {/* Progress and Timer */}
      <div className="flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground font-medium">
              Q{questionNumber}/{totalQuestions}
            </span>
            <span className="font-semibold text-primary animate-score-pop">+{question.points} pts</span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </div>
        
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full font-bold text-base shrink-0 transition-all duration-300",
          isLowTime 
            ? "bg-destructive/15 text-destructive animate-pulse" 
            : "bg-primary/15 text-primary"
        )}>
          {timeLeft}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear rounded-full",
            isLowTime ? "bg-destructive" : isMidTime ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${timePercentage}%` }}
        />
      </div>

      {/* Question Card - slides in */}
      <div className="glass rounded-2xl p-5 animate-fade-in" style={{ animationDuration: '220ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
            question.difficulty === 'easy' && "bg-success/15 text-success",
            question.difficulty === 'medium' && "bg-warning/15 text-warning",
            question.difficulty === 'hard' && "bg-destructive/15 text-destructive"
          )}>
            {question.difficulty}
          </span>
          
          {/* Running streak badge */}
          {currentStreak >= 2 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning animate-streak-glow">
              🔥 {currentStreak}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold leading-relaxed">{question.question}</h2>
      </div>

      {/* Options */}
      <div className="grid gap-2.5">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={showResult}
            className={getOptionClassName(index)}
          >
            {/* Floating score on correct answer */}
            {showFloatingScore && index === selectedOption && index === question.correctIndex && (
              <FloatingScore
                points={earnedPoints}
                speedBonus={speedBonus}
                comboText={comboText}
                isVisible={true}
              />
            )}

            <div className="flex items-center gap-3">
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200",
                showResult && index === question.correctIndex 
                  ? "bg-success text-success-foreground scale-110"
                  : showResult && index === selectedOption && index !== question.correctIndex
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted"
              )}>
                {showResult && index === question.correctIndex ? '✓' :
                 showResult && index === selectedOption && index !== question.correctIndex ? '✗' :
                 String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium text-sm flex-1 text-left">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
