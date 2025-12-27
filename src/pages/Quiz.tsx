import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shuffle, BookOpen } from 'lucide-react';
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

  // Handle random subject
  const handleRandomSubject = () => {
    const randomIndex = Math.floor(Math.random() * subjects.length);
    navigate(`/quiz/${subjects[randomIndex].id}`);
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
        <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-10 w-10 touch-target"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold truncate">
                  {subjects.find(s => s.id === state.subject)?.name} Quiz
                </h1>
                <p className="text-xs text-muted-foreground">
                  Question {state.currentIndex + 1} of {state.questions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="max-w-lg mx-auto px-4 py-6">
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
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Choose a Subject
          </h1>
          <p className="text-sm text-muted-foreground">
            10 questions • 30 seconds each
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Button 
          onClick={handleRandomSubject}
          variant="outline" 
          className="w-full h-12 touch-target"
        >
          <Shuffle className="h-5 w-5 mr-2" />
          Quick Start (Random Subject)
        </Button>
      </div>

      {/* Recommended Section */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">RECOMMENDED FOR YOU</h2>
        <div className="grid grid-cols-2 gap-3">
          {subjects.slice(0, 2).map((subject, index) => (
            <div
              key={subject.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SubjectCard
                subject={subject}
                onClick={() => handleSubjectSelect(subject.id)}
                userProgress={Math.floor(Math.random() * 80)}
                highScore={Math.floor(Math.random() * 5000) + 2000}
              />
            </div>
          ))}
        </div>
      </div>

      {/* All Subjects */}
      <div className="max-w-lg mx-auto px-4 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">ALL SUBJECTS</h2>
        <div className="grid grid-cols-2 gap-3">
          {subjects.slice(2).map((subject, index) => (
            <div
              key={subject.id}
              className="animate-fade-in"
              style={{ animationDelay: `${(index + 2) * 50}ms` }}
            >
              <SubjectCard
                subject={subject}
                onClick={() => handleSubjectSelect(subject.id)}
                userProgress={Math.floor(Math.random() * 50)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass rounded-2xl p-5 text-center">
          <h3 className="font-semibold mb-3">How it works</h3>
          <div className="text-sm text-muted-foreground space-y-2">
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