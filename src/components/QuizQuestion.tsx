import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { Question } from '@/types';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionIndex: number, timeSpent: number) => void;
  timeLimit?: number;
}

export const QuizQuestion = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  timeLimit = 30,
}: QuizQuestionProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelectedOption(null);
    setShowResult(false);
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

    setTimeout(() => {
      onAnswer(optionIndex, timeSpent);
    }, 1400); // Reduced from 1500ms to 1400ms for faster pacing
  }, [selectedOption, timeLimit, timeLeft, onAnswer]);

  const getOptionClassName = (index: number) => {
    const baseClasses = "p-4 rounded-xl text-left transition-all duration-200 touch-target w-full";
    
    if (!showResult) {
      return cn(
        baseClasses,
        "glass hover:bg-primary/10 hover:border-primary/30",
        "active:scale-[0.98]"
      );
    }

    if (index === question.correctIndex) {
      return cn(baseClasses, "bg-success/15 border-2 border-success");
    }

    if (index === selectedOption && index !== question.correctIndex) {
      return cn(baseClasses, "bg-destructive/15 border-2 border-destructive animate-shake");
    }

    return cn(baseClasses, "glass opacity-50");
  };

  const timePercentage = (timeLeft / timeLimit) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground font-medium">
              Q{questionNumber}/{totalQuestions}
            </span>
            <span className="font-semibold text-primary">+{question.points} pts</span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </div>
        
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full font-bold text-base shrink-0",
          isLowTime 
            ? "bg-destructive/15 text-destructive animate-pulse" 
            : "bg-primary/15 text-primary"
        )}>
          {timeLeft}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isLowTime ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${timePercentage}%` }}
        />
      </div>

      {/* Question */}
      <div className="glass rounded-2xl p-5">
        <span className={cn(
          "inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3 uppercase tracking-wide",
          question.difficulty === 'easy' && "bg-success/15 text-success",
          question.difficulty === 'medium' && "bg-warning/15 text-warning",
          question.difficulty === 'hard' && "bg-destructive/15 text-destructive"
        )}>
          {question.difficulty}
        </span>
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
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                showResult && index === question.correctIndex 
                  ? "bg-success text-success-foreground"
                  : showResult && index === selectedOption && index !== question.correctIndex
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted"
              )}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium text-sm flex-1 text-left">{option}</span>
              
              {showResult && index === question.correctIndex && (
                <span className="text-success text-lg shrink-0">✓</span>
              )}
              {showResult && index === selectedOption && index !== question.correctIndex && (
                <span className="text-destructive text-lg shrink-0">✗</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};