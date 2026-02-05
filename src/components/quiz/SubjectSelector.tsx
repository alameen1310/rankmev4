import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { subjects } from '@/data/mockData';
import type { Subject } from '@/types';
import type { QuizModeType } from '@/types/quiz-modes';
import { QUIZ_MODES } from '@/types/quiz-modes';

interface SubjectSelectorProps {
  mode: QuizModeType;
  onStart: (config: SubjectConfig) => void;
  onBack: () => void;
}

export interface SubjectConfig {
  subject: Subject;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}

export function SubjectSelector({ mode, onStart, onBack }: SubjectSelectorProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');

  const modeConfig = QUIZ_MODES[mode];
  const showQuestionCountSlider = typeof modeConfig.questionCount === 'object';
  const showDifficultySelector = modeConfig.allowDifficultySelection;

  const handleStart = () => {
    if (!selectedSubject) return;
    onStart({
      subject: selectedSubject,
      questionCount: showQuestionCountSlider ? questionCount : 
        typeof modeConfig.questionCount === 'number' ? modeConfig.questionCount : 10,
      difficulty,
    });
  };

  return (
    <div className="space-y-6">
      {/* Subject Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">SELECT SUBJECT</h3>
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200",
                selectedSubject === subject.id
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{subject.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {subject.questionsCount} questions
                  </p>
                </div>
                {selectedSubject === subject.id && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Question Count Slider (for Focus Drill) */}
      {showQuestionCountSlider && typeof modeConfig.questionCount === 'object' && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-muted-foreground">QUESTIONS</span>
            <span className="font-bold text-primary">{questionCount}</span>
          </div>
          <Slider
            value={[questionCount]}
            onValueChange={(v) => setQuestionCount(v[0])}
            min={modeConfig.questionCount.min}
            max={modeConfig.questionCount.max}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{modeConfig.questionCount.min}</span>
            <span>{modeConfig.questionCount.max}</span>
          </div>
        </div>
      )}

      {/* Difficulty Selector (for Focus Drill) */}
      {showDifficultySelector && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">DIFFICULTY</h3>
          <div className="grid grid-cols-4 gap-2">
            {(['mixed', 'easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={cn(
                  "p-3 rounded-xl text-sm font-medium transition-all capitalize",
                  difficulty === diff
                    ? diff === 'easy' ? "bg-success text-success-foreground" :
                      diff === 'medium' ? "bg-warning text-warning-foreground" :
                      diff === 'hard' ? "bg-destructive text-destructive-foreground" :
                      "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleStart} 
          disabled={!selectedSubject}
          className="flex-1"
        >
          Start {modeConfig.name}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
