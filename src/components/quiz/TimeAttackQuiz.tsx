import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Zap, Clock, ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getComboMultiplier, calculateXP, type ComboState } from '@/types/quiz-modes';
import type { Question, Subject } from '@/types';
import { getQuestionsBySubjectSlug } from '@/services/quiz';
import { getQuestionsBySubject as getMockQuestions } from '@/data/mockData';
import { toast } from 'sonner';
import { Confetti } from '@/components/Confetti';

interface TimeAttackQuizProps {
  subject: Subject;
  onComplete: (result: TimeAttackResult) => void;
  onExit: () => void;
}

export interface TimeAttackResult {
  questionsAnswered: number;
  correctAnswers: number;
  maxCombo: number;
  xpEarned: number;
  timeUsed: number;
}

const GLOBAL_TIME = 120; // 2 minutes

export function TimeAttackQuiz({ subject, onComplete, onExit }: TimeAttackQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GLOBAL_TIME);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  // Stats
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [combo, setCombo] = useState<ComboState>({ currentStreak: 0, multiplier: 1, maxStreak: 0 });
  
  const questionPoolRef = useRef<Question[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        // Load more questions for time attack
        let qs = await getQuestionsBySubjectSlug(subject, 50);
        if (qs.length === 0) {
          qs = getMockQuestions(subject);
        }
        // Shuffle
        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        questionPoolRef.current = shuffled;
        setQuestions(shuffled);
      } catch (error) {
        console.error('Error loading questions:', error);
        const mockQs = getMockQuestions(subject);
        questionPoolRef.current = mockQs;
        setQuestions(mockQs);
      } finally {
        setIsLoading(false);
        startTimeRef.current = Date.now();
      }
    };
    loadQuestions();
  }, [subject]);

  // Global timer
  useEffect(() => {
    if (isLoading || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isComplete]);

  const handleTimeUp = useCallback(() => {
    setIsComplete(true);
    const timeUsed = GLOBAL_TIME - timeLeft;
    const xpEarned = calculateXP({
      mode: 'time-attack',
      correctAnswers,
      totalQuestions: currentIndex + 1,
      averageTimePerQuestion: timeUsed / Math.max(1, currentIndex + 1),
      comboMultiplier: combo.multiplier,
    });

    onComplete({
      questionsAnswered: currentIndex + 1,
      correctAnswers,
      maxCombo: combo.maxStreak,
      xpEarned,
      timeUsed,
    });
  }, [timeLeft, correctAnswers, currentIndex, combo, onComplete]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (selectedOption !== null || isComplete) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    setSelectedOption(optionIndex);
    setShowResult(true);

    if (isCorrect) {
      const newStreak = combo.currentStreak + 1;
      const newMultiplier = getComboMultiplier(newStreak);
      setCombo({
        currentStreak: newStreak,
        multiplier: newMultiplier,
        maxStreak: Math.max(combo.maxStreak, newStreak),
      });
      setCorrectAnswers(prev => prev + 1);
    } else {
      // Reset combo on wrong answer
      setCombo(prev => ({ ...prev, currentStreak: 0, multiplier: 1 }));
    }

    // Quick transition to next question
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowResult(false);
      } else {
        // Ran out of questions
        handleTimeUp();
      }
    }, 600); // Faster transition for time attack
  }, [selectedOption, isComplete, questions, currentIndex, combo]);

  const getOptionClassName = (index: number) => {
    const baseClasses = "p-3.5 rounded-xl text-left transition-all duration-150 touch-target w-full";
    
    if (!showResult) {
      return cn(baseClasses, "glass hover:bg-primary/10 active:scale-[0.98]");
    }

    const currentQuestion = questions[currentIndex];
    if (index === currentQuestion?.correctIndex) {
      return cn(baseClasses, "bg-success/15 border-2 border-success");
    }
    if (index === selectedOption && index !== currentQuestion?.correctIndex) {
      return cn(baseClasses, "bg-destructive/15 border-2 border-destructive");
    }
    return cn(baseClasses, "glass opacity-50");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-pulse" />
          <p className="text-muted-foreground">Loading Time Attack...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const timeUsed = GLOBAL_TIME - timeLeft;
    const xpEarned = calculateXP({
      mode: 'time-attack',
      correctAnswers,
      totalQuestions: currentIndex + 1,
      averageTimePerQuestion: timeUsed / Math.max(1, currentIndex + 1),
      comboMultiplier: combo.multiplier,
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Confetti isActive={correctAnswers >= 10} />
        <Card className="w-full max-w-md p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Time's Up!</h1>
          <p className="text-muted-foreground mb-6">Great effort in Time Attack mode!</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-primary">{currentIndex + 1}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-success">{correctAnswers}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-orange-500">{combo.maxStreak}x</div>
              <div className="text-xs text-muted-foreground">Max Combo</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-warning">+{xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onExit}>
              Exit
            </Button>
            <Button className="flex-1" onClick={() => window.location.reload()}>
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const timePercentage = (timeLeft / GLOBAL_TIME) * 100;
  const isLowTime = timeLeft <= 20;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Combo Display */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold transition-all",
              combo.currentStreak >= 3 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse"
                : "bg-muted"
            )}>
              <Flame className="w-4 h-4" />
              <span>{combo.currentStreak}x</span>
              {combo.multiplier > 1 && (
                <span className="text-xs">({combo.multiplier}x XP)</span>
              )}
            </div>

            {/* Global Timer */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-lg",
              isLowTime ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
            )}>
              <Clock className="w-4 h-4" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          {/* Time Progress Bar */}
          <div className="mt-2">
            <Progress 
              value={timePercentage} 
              className={cn("h-1.5", isLowTime && "[&>div]:bg-destructive")}
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Q#{currentIndex + 1}</span>
          <span className="text-success font-medium">{correctAnswers} correct</span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-lg mx-auto px-4 space-y-4">
        <Card className="p-5">
          <span className={cn(
            "inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold mb-3 uppercase",
            currentQuestion?.difficulty === 'easy' && "bg-success/15 text-success",
            currentQuestion?.difficulty === 'medium' && "bg-warning/15 text-warning",
            currentQuestion?.difficulty === 'hard' && "bg-destructive/15 text-destructive"
          )}>
            {currentQuestion?.difficulty}
          </span>
          <h2 className="text-lg font-bold leading-relaxed">{currentQuestion?.question}</h2>
        </Card>

        {/* Options */}
        <div className="grid gap-2.5">
          {currentQuestion?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={showResult}
              className={getOptionClassName(index)}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                  showResult && index === currentQuestion.correctIndex
                    ? "bg-success text-success-foreground"
                    : showResult && index === selectedOption && index !== currentQuestion.correctIndex
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted"
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium text-sm flex-1 text-left">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
