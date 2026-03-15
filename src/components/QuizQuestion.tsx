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
        if (prev <= 1) { handleOptionSelect(-1); return 0; }
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
      const bonus = Math.max(0, Math.floor((30 - timeSpent) / 30 * 50));
      const total = question.points + bonus;
      setEarnedPoints(total);
      setSpeedBonus(bonus > 15 ? bonus : 0);

      const newStreak = currentStreak + 1;
      if (timeSpent < 5) setComboText('⚡ LIGHTNING!');
      else if (timeSpent < 10) setComboText('🚀 FAST!');
      else if (newStreak >= 3) setComboText(`${newStreak}x COMBO!`);

      setTimeout(() => setShowFloatingScore(true), 200);
      if (newStreak >= 3) setTimeout(() => setShowStreak(true), 400);
    }

    setTimeout(() => onAnswer(optionIndex, timeSpent), 1400);
  }, [selectedOption, timeLimit, timeLeft, onAnswer, question.correctIndex, question.points, currentStreak]);

  const getOptionClassName = (index: number) => {
    const base = "relative p-4 rounded-xl text-left transition-all duration-150 w-full border";
    if (!showResult) {
      return cn(base, "bg-card border-border hover:border-primary/40 active:scale-[0.98]");
    }
    if (index === question.correctIndex) {
      return cn(base, "bg-success/10 border-success animate-correct-glow");
    }
    if (index === selectedOption && index !== question.correctIndex) {
      return cn(base, "bg-destructive/10 border-destructive animate-shake");
    }
    return cn(base, "bg-card border-border opacity-40");
  };

  const timePercentage = (timeLeft / timeLimit) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="space-y-4">
      <StreakIndicator streak={currentStreak + (selectedOption === question.correctIndex ? 1 : 0)} show={showStreak} />

      {/* Progress + Timer */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground font-medium">Q{questionNumber}/{totalQuestions}</span>
            <span className="font-semibold text-primary">+{question.points} pts</span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-1.5" />
        </div>
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shrink-0",
          isLowTime ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          {timeLeft}
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear rounded-full",
            isLowTime ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${timePercentage}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
            question.difficulty === 'easy' && "bg-success/10 text-success",
            question.difficulty === 'medium' && "bg-warning/10 text-warning",
            question.difficulty === 'hard' && "bg-destructive/10 text-destructive"
          )}>
            {question.difficulty}
          </span>
          {currentStreak >= 2 && (
            <span className="text-[10px] font-bold text-warning">🔥 {currentStreak}</span>
          )}
        </div>
        <h2 className="text-base font-bold leading-relaxed">{question.question}</h2>
      </div>

      {/* Options */}
      <div className="grid gap-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={showResult}
            className={getOptionClassName(index)}
          >
            {showFloatingScore && index === selectedOption && index === question.correctIndex && (
              <FloatingScore points={earnedPoints} speedBonus={speedBonus} comboText={comboText} isVisible={true} />
            )}
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0",
                showResult && index === question.correctIndex
                  ? "bg-success text-success-foreground"
                  : showResult && index === selectedOption && index !== question.correctIndex
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-secondary"
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
