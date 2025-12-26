import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubjectCard } from '@/components/SubjectCard';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QuizResult } from '@/components/QuizResult';
import { useQuiz } from '@/contexts/QuizContext';
import { subjects } from '@/data/mockData';
import type { Subject } from '@/types';

export const Quiz = () => {
  const { subject: subjectParam } = useParams<{ subject?: string }>();
  const navigate = useNavigate();
  const {
    state,
    startQuiz,
    answerQuestion,
    nextQuestion,
    getResult,
    resetQuiz,
    currentQuestion,
    progress,
  } = useQuiz();

  // Start quiz if subject is provided and not already active
  useEffect(() => {
    if (subjectParam && !state.isActive && !state.isComplete) {
      const validSubject = subjects.find(s => s.id === subjectParam);
      if (validSubject) {
        startQuiz(subjectParam as Subject);
      }
    }
  }, [subjectParam, state.isActive, state.isComplete, startQuiz]);

  // Handle answer submission
  const handleAnswer = (optionIndex: number, timeSpent: number) => {
    answerQuestion(optionIndex, timeSpent);
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  // Handle retry
  const handleRetry = () => {
    if (state.subject) {
      resetQuiz();
      startQuiz(state.subject);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subjectId: Subject) => {
    navigate(`/quiz/${subjectId}`);
  };

  // Handle back navigation
  const handleBack = () => {
    if (state.isActive) {
      if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
        resetQuiz();
        navigate('/quiz');
      }
    } else {
      navigate('/quiz');
    }
  };

  // Show result screen
  if (state.isComplete) {
    return <QuizResult result={getResult()} onRetry={handleRetry} />;
  }

  // Show quiz in progress
  if (state.isActive && currentQuestion) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="glass sticky top-14 z-40 border-b border-border/50">
          <div className="container max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-semibold">
                  {subjects.find(s => s.id === state.subject)?.name} Quiz
                </h1>
                <p className="text-xs text-muted-foreground">
                  {state.currentIndex + 1} of {state.questions.length} questions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="container max-w-lg mx-auto px-4 py-6">
          <QuizQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            questionNumber={state.currentIndex + 1}
            totalQuestions={state.questions.length}
            onAnswer={handleAnswer}
          />
        </div>
      </div>
    );
  }

  // Show subject selection
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass sticky top-14 z-40 border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">⚡ Choose a Subject</h1>
          <p className="text-sm text-muted-foreground">
            10 questions • 30 seconds each
          </p>
        </div>
      </div>

      {/* Subject Grid */}
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subject, index) => (
            <div
              key={subject.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SubjectCard
                subject={subject}
                onClick={() => handleSubjectSelect(subject.id)}
              />
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-8 glass rounded-2xl p-5 text-center">
          <h3 className="font-semibold mb-2">How it works</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📝 Answer 10 multiple-choice questions</p>
            <p>⏱️ 30 seconds per question</p>
            <p>🎯 Faster answers = more points</p>
            <p>🔥 Build streaks for bonus points</p>
          </div>
        </div>
      </div>
    </div>
  );
};
