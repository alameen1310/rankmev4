import { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { QuestionReviewCard } from './QuestionReviewCard';
import type { Question } from '@/types';

interface PostQuizReviewProps {
  questions: Question[];
  answers: (number | null)[];
  times: number[];
  onClose: () => void;
}

type ReviewFilter = 'all' | 'correct' | 'incorrect';

export function PostQuizReview({ questions, answers, times, onClose }: PostQuizReviewProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const incorrectCount = questions.length - correctCount;

  const filtered = questions
    .map((q, i) => ({ question: q, answer: answers[i], time: times[i], index: i }))
    .filter(item => {
      if (filter === 'correct') return item.answer === item.question.correctIndex;
      if (filter === 'incorrect') return item.answer !== item.question.correctIndex;
      return true;
    });

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Review Answers
              </h1>
              <p className="text-xs text-muted-foreground">
                {correctCount}/{questions.length} correct
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Summary bar */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-bold text-success">{correctCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="font-bold text-destructive">{incorrectCount}</span>
            </div>
            <div className="flex-1">
              <Progress value={(correctCount / questions.length) * 100} className="h-2" />
            </div>
            <span className="text-sm font-bold">{Math.round((correctCount / questions.length) * 100)}%</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {([
            { key: 'all' as const, label: 'All', count: questions.length },
            { key: 'incorrect' as const, label: 'Wrong', count: incorrectCount },
            { key: 'correct' as const, label: 'Correct', count: correctCount },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Question cards */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <QuestionReviewCard
              key={item.question.id}
              question={item.question}
              userAnswer={item.answer}
              timeSpent={item.time}
              questionNumber={item.index + 1}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No questions match this filter.
          </div>
        )}
      </div>
    </div>
  );
}