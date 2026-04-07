import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Question } from '@/types';

interface ReviewStep {
  label: string;
  content: string;
  type: 'given' | 'formula' | 'substitution' | 'result' | 'mistake';
}

interface QuestionReviewCardProps {
  question: Question;
  userAnswer: number | null;
  timeSpent: number;
  questionNumber: number;
}

function generateSteps(question: Question, userAnswer: number | null): ReviewStep[] {
  const isCorrect = userAnswer === question.correctIndex;
  const correctOption = question.options[question.correctIndex];
  
  const steps: ReviewStep[] = [
    {
      label: 'Question',
      content: question.question,
      type: 'given',
    },
    {
      label: 'Correct Answer',
      content: correctOption,
      type: 'result',
    },
  ];

  if (!isCorrect && userAnswer !== null && userAnswer >= 0) {
    steps.push({
      label: 'Your Mistake',
      content: `You selected "${question.options[userAnswer]}" — this is incorrect. The right answer is "${correctOption}".`,
      type: 'mistake',
    });
  }

  if (!isCorrect && (userAnswer === null || userAnswer < 0)) {
    steps.push({
      label: 'Time Out',
      content: 'You ran out of time on this question. Try to answer faster next time!',
      type: 'mistake',
    });
  }

  return steps;
}

export function QuestionReviewCard({ question, userAnswer, timeSpent, questionNumber }: QuestionReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState(1);
  
  const isCorrect = userAnswer === question.correctIndex;
  const steps = generateSteps(question, userAnswer);

  const revealNextStep = () => {
    if (revealedSteps < steps.length) {
      setRevealedSteps(prev => prev + 1);
    }
  };

  const stepColors: Record<ReviewStep['type'], string> = {
    given: 'border-l-primary bg-primary/5',
    formula: 'border-l-blue-500 bg-blue-500/5',
    substitution: 'border-l-amber-500 bg-amber-500/5',
    result: 'border-l-success bg-success/5',
    mistake: 'border-l-destructive bg-destructive/5',
  };

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all duration-200",
      isCorrect ? "border-success/30" : "border-destructive/30"
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        )}>
          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Q{questionNumber}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase",
              question.difficulty === 'easy' && "bg-success/10 text-success",
              question.difficulty === 'medium' && "bg-warning/10 text-warning",
              question.difficulty === 'hard' && "bg-destructive/10 text-destructive"
            )}>
              {question.difficulty}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{question.question}</p>
        </div>

        <div className="text-xs text-muted-foreground shrink-0">{timeSpent.toFixed(1)}s</div>
        
        {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Options display */}
          <div className="grid gap-1.5">
            {question.options.map((option, idx) => {
              const isUserChoice = idx === userAnswer;
              const isCorrectOption = idx === question.correctIndex;
              
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                    isCorrectOption && "bg-success/10 border border-success/30",
                    isUserChoice && !isCorrectOption && "bg-destructive/10 border border-destructive/30 animate-[shake_0.3s_ease-in-out]",
                    !isCorrectOption && !isUserChoice && "bg-muted/30 opacity-50"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isCorrectOption ? "bg-success text-success-foreground" :
                    isUserChoice ? "bg-destructive text-destructive-foreground" :
                    "bg-muted"
                  )}>
                    {isCorrectOption ? '✓' : isUserChoice ? '✗' : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isUserChoice && !isCorrectOption && (
                    <span className="text-[10px] text-destructive font-medium">Your answer</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Step-based explanation */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Lightbulb className="w-3.5 h-3.5" />
              Explanation Steps
            </div>
            
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  "border-l-2 rounded-r-lg px-3 py-2 transition-all duration-300",
                  stepColors[step.type],
                  idx < revealedSteps
                    ? "opacity-100 translate-y-0"
                    : "opacity-30 blur-[2px] pointer-events-none"
                )}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-0.5">
                  {idx < revealedSteps ? step.label : `Step ${idx + 1} — Tap to reveal`}
                </div>
                {idx < revealedSteps && (
                  <p className="text-sm">{step.content}</p>
                )}
              </div>
            ))}

            {revealedSteps < steps.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={revealNextStep}
                className="w-full text-xs h-8"
              >
                Reveal Next Step ({revealedSteps}/{steps.length})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}