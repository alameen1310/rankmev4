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
          // Time's up - auto submit with no answer
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
    }, 1500);
  }, [selectedOption, timeLimit, timeLeft, onAnswer]);

  const getOptionClassName = (index: number) => {
    if (!showResult) {
      return cn(
        "glass p-4 rounded-xl text-left transition-all duration-200",
        "hover:bg-primary/10 hover:border-primary/30 hover:scale-[1.01]",
        "active:scale-[0.99]"
      );
    }

    if (index === question.correctIndex) {
      return "bg-success/20 border-2 border-success p-4 rounded-xl text-left";
    }

    if (index === selectedOption && index !== question.correctIndex) {
      return "bg-destructive/20 border-2 border-destructive p-4 rounded-xl text-left animate-shake";
    }

    return "glass p-4 rounded-xl text-left opacity-50";
  };

  const timePercentage = (timeLeft / timeLimit) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </span>
            <span className="font-medium text-primary">+{question.points} pts</span>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </div>
        
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full font-bold text-lg",
          isLowTime 
            ? "bg-destructive/20 text-destructive animate-pulse" 
            : "bg-primary/20 text-primary"
        )}>
          {timeLeft}s
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
      <div className="glass rounded-2xl p-6">
        <span className={cn(
          "inline-block px-3 py-1 rounded-full text-xs font-medium mb-3",
          question.difficulty === 'easy' && "bg-success/20 text-success",
          question.difficulty === 'medium' && "bg-warning/20 text-warning",
          question.difficulty === 'hard' && "bg-destructive/20 text-destructive"
        )}>
          {question.difficulty.toUpperCase()}
        </span>
        <h2 className="text-xl font-bold leading-relaxed">{question.question}</h2>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={showResult}
            className={getOptionClassName(index)}
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                showResult && index === question.correctIndex 
                  ? "bg-success text-success-foreground"
                  : showResult && index === selectedOption && index !== question.correctIndex
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted"
              )}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium">{option}</span>
              
              {showResult && index === question.correctIndex && (
                <span className="ml-auto text-success">✓</span>
              )}
              {showResult && index === selectedOption && index !== question.correctIndex && (
                <span className="ml-auto text-destructive">✗</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
