import { useState, useEffect, useCallback } from 'react';
import { Skull, Heart, ArrowLeft, Trophy, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getSurvivalDifficulty, calculateXP } from '@/types/quiz-modes';
import type { Question, Subject } from '@/types';
import { getQuestionsBySubjectSlug } from '@/services/quiz';
import { getQuestionsBySubject as getMockQuestions } from '@/data/mockData';
import { Confetti } from '@/components/Confetti';

interface SurvivalQuizProps {
  subject: Subject;
  onComplete: (result: SurvivalResult) => void;
  onExit: () => void;
}

export interface SurvivalResult {
  roundsSurvived: number;
  xpEarned: number;
  maxDifficultyReached: 'easy' | 'medium' | 'hard';
}

const TIME_PER_QUESTION = 20;

export function SurvivalQuiz({ subject, onComplete, onExit }: SurvivalQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEliminated, setIsEliminated] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        let qs = await getQuestionsBySubjectSlug(subject, 100);
        if (qs.length === 0) {
          qs = getMockQuestions(subject);
        }
        // Shuffle and prioritize by difficulty for survival
        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions(getMockQuestions(subject));
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [subject]);

  // Timer
  useEffect(() => {
    if (isLoading || showResult || isEliminated) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        if (prev === 6) {
          setShowWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, showResult, isEliminated, currentIndex]);

  const handleTimeout = useCallback(() => {
    // Timeout = elimination
    eliminate();
  }, [currentIndex]);

  const eliminate = useCallback(() => {
    setIsEliminated(true);
    const maxDifficulty = getSurvivalDifficulty(currentIndex);
    const xpEarned = calculateXP({
      mode: 'survival',
      correctAnswers: currentIndex,
      totalQuestions: currentIndex,
      averageTimePerQuestion: TIME_PER_QUESTION / 2,
      roundsSurvived: currentIndex,
    });

    onComplete({
      roundsSurvived: currentIndex,
      xpEarned,
      maxDifficultyReached: maxDifficulty,
    });
  }, [currentIndex, onComplete]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (selectedOption !== null || isEliminated) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    setSelectedOption(optionIndex);
    setShowResult(true);

    if (!isCorrect) {
      // Wrong answer = elimination
      setTimeout(() => eliminate(), 1200);
    } else {
      // Correct - move to next round
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowResult(false);
          setTimeLeft(TIME_PER_QUESTION);
          setShowWarning(false);
        } else {
          // Ran out of questions - victory!
          eliminate();
        }
      }, 1000);
    }
  }, [selectedOption, isEliminated, questions, currentIndex, eliminate]);

  const getOptionClassName = (index: number) => {
    const baseClasses = "p-4 rounded-xl text-left transition-all duration-200 touch-target w-full";
    
    if (!showResult) {
      return cn(baseClasses, "glass hover:bg-primary/10 active:scale-[0.98]");
    }

    const currentQuestion = questions[currentIndex];
    if (index === currentQuestion?.correctIndex) {
      return cn(baseClasses, "bg-success/15 border-2 border-success");
    }
    if (index === selectedOption && index !== currentQuestion?.correctIndex) {
      return cn(baseClasses, "bg-destructive/15 border-2 border-destructive animate-shake");
    }
    return cn(baseClasses, "glass opacity-50");
  };

  const currentDifficulty = getSurvivalDifficulty(currentIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skull className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-pulse" />
          <p className="text-muted-foreground">Preparing Survival Mode...</p>
        </div>
      </div>
    );
  }

  if (isEliminated) {
    const xpEarned = calculateXP({
      mode: 'survival',
      correctAnswers: currentIndex,
      totalQuestions: currentIndex,
      averageTimePerQuestion: TIME_PER_QUESTION / 2,
      roundsSurvived: currentIndex,
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Confetti isActive={currentIndex >= 10} />
        <Card className="w-full max-w-md p-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            currentIndex >= 10 
              ? "bg-gradient-to-br from-purple-500 to-pink-500"
              : "bg-muted"
          )}>
            {currentIndex >= 10 ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : (
              <Skull className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {currentIndex >= 10 ? 'Amazing Run!' : 'Eliminated!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            You survived {currentIndex} round{currentIndex !== 1 ? 's' : ''}!
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-primary">{currentIndex}</div>
              <div className="text-xs text-muted-foreground">Rounds</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className={cn(
                "text-2xl font-bold capitalize",
                currentDifficulty === 'hard' ? 'text-destructive' : 
                currentDifficulty === 'medium' ? 'text-warning' : 'text-success'
              )}>
                {currentDifficulty}
              </div>
              <div className="text-xs text-muted-foreground">Max Diff.</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-warning">+{xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onExit}>
              Exit
            </Button>
            <Button className="flex-1" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const timePercentage = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Round Counter */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold",
                currentDifficulty === 'hard' ? 'bg-destructive/15 text-destructive' :
                currentDifficulty === 'medium' ? 'bg-warning/15 text-warning' :
                'bg-success/15 text-success'
              )}>
                <Shield className="w-4 h-4" />
                Round {currentIndex + 1}
              </div>
            </div>

            {/* Life Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15">
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
              <span className="font-bold text-destructive">1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/15 text-destructive text-sm animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Hurry up! Time is running out!</span>
          </div>
        </div>
      )}

      {/* Timer Bar */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Progress 
            value={timePercentage} 
            className={cn("flex-1 h-2", timeLeft <= 5 && "[&>div]:bg-destructive")}
          />
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
            timeLeft <= 5 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted"
          )}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Difficulty Indicator */}
      <div className="max-w-lg mx-auto px-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Difficulty:</span>
          <span className={cn(
            "font-medium capitalize",
            currentDifficulty === 'hard' ? 'text-destructive' :
            currentDifficulty === 'medium' ? 'text-warning' : 'text-success'
          )}>
            {currentDifficulty}
          </span>
          <span className="text-xs">(increases every 3 rounds)</span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-lg mx-auto px-4 space-y-4">
        <Card className="p-5 border-2 border-purple-500/20">
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
