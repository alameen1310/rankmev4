import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Lightbulb, RotateCcw, ChevronRight, Brain, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getQuestionsBySubjectSlug } from '@/services/quiz';
import { getQuestionsBySubject as getMockQuestions } from '@/data/mockData';
import type { Question, Subject } from '@/types';

interface SmartPracticeResult {
  totalQuestions: number;
  correctFirstTry: number;
  hintsUsed: number;
  totalRetries: number;
  xpEarned: number;
}

interface SmartPracticeQuizProps {
  subject: Subject;
  onComplete: (result: SmartPracticeResult) => void;
  onExit: () => void;
}

type QuestionPhase = 'answering' | 'hint' | 'correct' | 'step-solve';

interface HintLevel {
  text: string;
  type: 'concept' | 'formula' | 'partial';
}

function generateHints(question: Question): HintLevel[] {
  const correct = question.options[question.correctIndex];
  return [
    { text: `Think about the key concept in this ${question.subject} question.`, type: 'concept' },
    { text: `The answer is related to: "${correct.substring(0, Math.ceil(correct.length * 0.4))}..."`, type: 'formula' },
    { text: `The correct answer starts with option ${String.fromCharCode(65 + question.correctIndex)}.`, type: 'partial' },
  ];
}

export function SmartPracticeQuiz({ subject, onComplete, onExit }: SmartPracticeQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>('answering');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [retries, setRetries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [totalRetries, setTotalRetries] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        let qs = await getQuestionsBySubjectSlug(subject, 10);
        if (qs.length === 0) qs = getMockQuestions(subject);
        setQuestions(qs);
      } catch {
        setQuestions(getMockQuestions(subject));
      }
      setIsLoading(false);
    })();
  }, [subject]);

  const currentQuestion = questions[currentIndex];
  const hints = currentQuestion ? generateHints(currentQuestion) : [];

  const handleSelect = useCallback((idx: number) => {
    if (phase !== 'answering') return;
    setSelectedOption(idx);

    if (idx === currentQuestion?.correctIndex) {
      if (retries === 0) setFirstTryCorrect(prev => prev + 1);
      setPhase('correct');
    } else {
      // Wrong — show hint
      setPhase('hint');
    }
  }, [phase, currentQuestion, retries]);

  const handleRetry = () => {
    setSelectedOption(null);
    setRetries(prev => prev + 1);
    setTotalRetries(prev => prev + 1);
    setPhase('answering');
  };

  const handleRevealHint = () => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed(prev => prev + 1);
      setTotalHints(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const xp = firstTryCorrect * 15 + (questions.length - totalHints) * 5;
      setIsComplete(true);
      onComplete({
        totalQuestions: questions.length,
        correctFirstTry: firstTryCorrect + (retries === 0 && phase === 'correct' ? 0 : 0),
        hintsUsed: totalHints,
        totalRetries: totalRetries,
        xpEarned: Math.max(xp, 10),
      });
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setPhase('answering');
    setSelectedOption(null);
    setHintsRevealed(0);
    setRetries(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Brain className="w-10 h-10 text-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading practice questions…</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const xp = firstTryCorrect * 15 + (questions.length - totalHints) * 5;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Brain className="w-14 h-14 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Practice Complete!</h1>
        <p className="text-muted-foreground mb-6">Great job working through those questions.</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-success">{firstTryCorrect}</div>
            <div className="text-[10px] text-muted-foreground">First Try</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-primary">+{Math.max(xp, 10)}</div>
            <div className="text-[10px] text-muted-foreground">XP Earned</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-warning">{totalHints}</div>
            <div className="text-[10px] text-muted-foreground">Hints Used</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{totalRetries}</div>
            <div className="text-[10px] text-muted-foreground">Retries</div>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-xs">
          <Button variant="outline" className="flex-1" onClick={onExit}>
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
          <Button className="flex-1" onClick={() => {
            setCurrentIndex(0);
            setPhase('answering');
            setSelectedOption(null);
            setHintsRevealed(0);
            setRetries(0);
            setFirstTryCorrect(0);
            setTotalHints(0);
            setTotalRetries(0);
            setIsComplete(false);
          }}>
            <RotateCcw className="w-4 h-4 mr-2" /> Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onExit} className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Smart Practice
              </h1>
              <p className="text-xs text-muted-foreground">
                Q{currentIndex + 1} of {questions.length} • No timer
              </p>
            </div>
          </div>
          <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 mt-2" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Question */}
        <div className="bg-card border border-border rounded-xl p-5">
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase mb-2",
            currentQuestion.difficulty === 'easy' && "bg-success/10 text-success",
            currentQuestion.difficulty === 'medium' && "bg-warning/10 text-warning",
            currentQuestion.difficulty === 'hard' && "bg-destructive/10 text-destructive"
          )}>
            {currentQuestion.difficulty}
          </span>
          <h2 className="text-base font-bold leading-relaxed">{currentQuestion.question}</h2>
        </div>

        {/* Hints section */}
        {hintsRevealed > 0 && (
          <div className="space-y-2">
            {hints.slice(0, hintsRevealed).map((hint, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 border-l-2 border-l-warning bg-warning/5 rounded-r-lg px-3 py-2 animate-fade-in"
              >
                <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm">{hint.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Options */}
        <div className="grid gap-2">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={phase === 'correct' || phase === 'hint'}
              className={cn(
                "relative p-4 rounded-xl text-left transition-all duration-150 w-full border",
                phase === 'correct' && idx === currentQuestion.correctIndex
                  ? "bg-success/10 border-success"
                  : phase === 'hint' && idx === selectedOption
                    ? "bg-destructive/10 border-destructive animate-[shake_0.3s_ease-in-out]"
                    : phase === 'correct' || phase === 'hint'
                      ? "bg-card border-border opacity-40"
                      : "bg-card border-border hover:border-primary/40 active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0",
                  phase === 'correct' && idx === currentQuestion.correctIndex
                    ? "bg-success text-success-foreground"
                    : phase === 'hint' && idx === selectedOption
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary"
                )}>
                  {phase === 'correct' && idx === currentQuestion.correctIndex ? '✓' :
                   phase === 'hint' && idx === selectedOption ? '✗' :
                   String.fromCharCode(65 + idx)}
                </span>
                <span className="font-medium text-sm flex-1 text-left">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        {phase === 'hint' && (
          <div className="flex gap-2 animate-fade-in">
            <Button variant="outline" onClick={handleRevealHint} disabled={hintsRevealed >= hints.length} className="flex-1">
              <Lightbulb className="w-4 h-4 mr-2" />
              Hint ({hintsRevealed}/{hints.length})
            </Button>
            <Button onClick={handleRetry} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {phase === 'correct' && (
          <div className="animate-fade-in">
            <div className="bg-success/10 border border-success/30 rounded-xl p-3 mb-3 text-center">
              <span className="text-sm font-semibold text-success">
                {retries === 0 ? '🎯 Perfect — First Try!' : `✅ Correct after ${retries} ${retries === 1 ? 'retry' : 'retries'}`}
              </span>
              {retries === 0 && hintsRevealed === 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-warning" />
                  <span className="text-xs text-warning font-medium">+15 XP Bonus</span>
                </div>
              )}
            </div>
            <Button onClick={handleNext} className="w-full">
              {currentIndex + 1 >= questions.length ? 'Finish Practice' : 'Next Question'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}