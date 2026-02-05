import { useState, useEffect, useCallback } from 'react';
import { Target, Check, X, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateXP } from '@/types/quiz-modes';
import type { Question, Subject } from '@/types';
import { getQuestionsBySubjectSlug } from '@/services/quiz';
import { getQuestionsBySubject as getMockQuestions } from '@/data/mockData';
import { Confetti } from '@/components/Confetti';

interface FocusDrillQuizProps {
  subject: Subject;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  onComplete: (result: FocusDrillResult) => void;
  onExit: () => void;
}

export interface FocusDrillResult {
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  xpEarned: number;
  timeSpent: number;
  topicPerformance: Record<string, { correct: number; total: number }>;
}

export function FocusDrillQuiz({ 
  subject, 
  questionCount, 
  difficulty, 
  onComplete, 
  onExit 
}: FocusDrillQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  
  // Stats
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [startTime] = useState(Date.now());

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        let qs = await getQuestionsBySubjectSlug(subject, questionCount * 2);
        if (qs.length === 0) {
          qs = getMockQuestions(subject);
        }
        
        // Filter by difficulty if not mixed
        let filtered = qs;
        if (difficulty !== 'mixed') {
          filtered = qs.filter(q => q.difficulty === difficulty);
          if (filtered.length < questionCount) {
            filtered = qs; // Fallback to all if not enough
          }
        }
        
        // Shuffle and take required count
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, questionCount));
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions(getMockQuestions(subject).slice(0, questionCount));
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [subject, questionCount, difficulty]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (selectedOption !== null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    setSelectedOption(optionIndex);
    setShowResult(true);
    setAnswers(prev => [...prev, isCorrect]);
  }, [selectedOption, questions, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Complete
      const correctCount = answers.filter(a => a).length;
      const accuracy = (correctCount / questions.length) * 100;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const xpEarned = calculateXP({
        mode: 'focus-drill',
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        averageTimePerQuestion: timeSpent / questions.length,
        difficulty: difficulty === 'mixed' ? 'medium' : difficulty,
      });

      setIsComplete(true);
      onComplete({
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        accuracy,
        xpEarned,
        timeSpent,
        topicPerformance: {}, // Could track by topic if data available
      });
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  }, [currentIndex, questions, answers, startTime, difficulty, onComplete]);

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
      return cn(baseClasses, "bg-destructive/15 border-2 border-destructive");
    }
    return cn(baseClasses, "glass opacity-50");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-pulse" />
          <p className="text-muted-foreground">Preparing Focus Drill...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = answers.filter(a => a).length;
    const accuracy = (correctCount / questions.length) * 100;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const xpEarned = calculateXP({
      mode: 'focus-drill',
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      averageTimePerQuestion: timeSpent / questions.length,
      difficulty: difficulty === 'mixed' ? 'medium' : difficulty,
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Confetti isActive={accuracy >= 80} />
        <Card className="w-full max-w-md p-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            accuracy >= 80 ? "bg-gradient-to-br from-emerald-500 to-green-500" :
            accuracy >= 60 ? "bg-gradient-to-br from-yellow-500 to-orange-500" :
            "bg-muted"
          )}>
            {accuracy >= 80 ? (
              <Target className="w-10 h-10 text-white" />
            ) : (
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {accuracy >= 80 ? 'Excellent Focus!' : accuracy >= 60 ? 'Good Practice!' : 'Keep Practicing!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {Math.round(accuracy)}% accuracy in Focus Drill
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-success">{correctCount}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-destructive">{questions.length - correctCount}</div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="bg-muted rounded-xl p-3">
              <div className="text-2xl font-bold text-warning">+{xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>

          {/* Accuracy Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="font-bold">{Math.round(accuracy)}%</span>
            </div>
            <Progress value={accuracy} className="h-3" />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onExit}>
              Exit
            </Button>
            <Button className="flex-1" onClick={() => window.location.reload()}>
              Practice More
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onExit}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold">Focus Drill</span>
            </div>

            <div className="text-sm font-medium text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </div>
          </div>
          
          <Progress value={progressPercentage} className="mt-2 h-1.5" />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-success" />
              <span className="font-medium">{answers.filter(a => a).length}</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="w-4 h-4 text-destructive" />
              <span className="font-medium">{answers.filter(a => !a).length}</span>
            </div>
          </div>
          <Badge variant="secondary" className="capitalize">
            {difficulty} difficulty
          </Badge>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-lg mx-auto px-4 space-y-4">
        <Card className="p-5 border-2 border-emerald-500/20">
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
                
                {showResult && index === currentQuestion.correctIndex && (
                  <Check className="w-5 h-5 text-success" />
                )}
                {showResult && index === selectedOption && index !== currentQuestion.correctIndex && (
                  <X className="w-5 h-5 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Next Button (only shows after answering) */}
        {showResult && (
          <Button onClick={handleNext} className="w-full h-12 mt-4 animate-fade-in">
            {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
