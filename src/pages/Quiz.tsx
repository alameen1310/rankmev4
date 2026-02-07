import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Zap, Target, Flame, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizModeSelector } from '@/components/quiz/QuizModeSelector';
import { SubjectSelector, type SubjectConfig } from '@/components/quiz/SubjectSelector';
import { QuizQuestion } from '@/components/QuizQuestion';
import { QuizResult } from '@/components/QuizResult';
import { TimeAttackQuiz, type TimeAttackResult } from '@/components/quiz/TimeAttackQuiz';
import { SurvivalQuiz, type SurvivalResult } from '@/components/quiz/SurvivalQuiz';
import { FocusDrillQuiz, type FocusDrillResult } from '@/components/quiz/FocusDrillQuiz';
import { useQuiz } from '@/contexts/QuizContext';
import { QUIZ_MODES, type QuizModeType } from '@/types/quiz-modes';
import type { Subject } from '@/types';

type QuizStep = 'mode-select' | 'subject-select' | 'playing' | 'result';

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

  const [step, setStep] = useState<QuizStep>('mode-select');
  const [selectedMode, setSelectedMode] = useState<QuizModeType | null>(null);
  const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);

  // Handle URL-based subject navigation (legacy support)
  useEffect(() => {
    if (subjectParam && !state.isActive && !state.isComplete) {
      setSelectedMode('quick-play');
      setSubjectConfig({
        subject: subjectParam as Subject,
        questionCount: 10,
        difficulty: 'mixed',
      });
      startQuiz(subjectParam as Subject);
      setStep('playing');
    }
  }, [subjectParam, state.isActive, state.isComplete, startQuiz]);

  // Handle mode selection
  const handleModeSelect = useCallback((mode: QuizModeType) => {
    setSelectedMode(mode);
    setStep('subject-select');
  }, []);

  // Handle subject selection and start quiz
  const handleSubjectStart = useCallback(async (config: SubjectConfig) => {
    setSubjectConfig(config);
    
    // For Quick Play, use the existing quiz context
    if (selectedMode === 'quick-play') {
      await startQuiz(config.subject);
      setStep('playing');
    } else {
      // Other modes have their own components
      setStep('playing');
    }
  }, [selectedMode, startQuiz]);

  // Handle answer in Quick Play mode
  const handleAnswer = useCallback((optionIndex: number, timeSpent: number) => {
    answerQuestion(optionIndex, timeSpent);
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  }, [answerQuestion, nextQuestion]);

  // Handle retry
  const handleRetry = useCallback(() => {
    resetQuiz();
    if (selectedMode && subjectConfig) {
      startQuiz(subjectConfig.subject);
      setStep('playing');
    } else {
      setStep('mode-select');
      setSelectedMode(null);
      setSubjectConfig(null);
    }
  }, [selectedMode, subjectConfig, resetQuiz, startQuiz]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === 'subject-select') {
      setStep('mode-select');
      setSelectedMode(null);
    } else if (step === 'playing') {
      if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
        resetQuiz();
        setStep('mode-select');
        setSelectedMode(null);
        setSubjectConfig(null);
      }
    } else {
      navigate('/dashboard');
    }
  }, [step, resetQuiz, navigate]);

  // Handle special mode completions
  const handleTimeAttackComplete = useCallback((result: TimeAttackResult) => {
    console.log('Time Attack complete:', result);
    // Could save to DB here
  }, []);

  const handleSurvivalComplete = useCallback((result: SurvivalResult) => {
    console.log('Survival complete:', result);
    // Could save to DB here
  }, []);

  const handleFocusDrillComplete = useCallback((result: FocusDrillResult) => {
    console.log('Focus Drill complete:', result);
    // Could save to DB here
  }, []);

  const handleExitSpecialMode = useCallback(() => {
    setStep('mode-select');
    setSelectedMode(null);
    setSubjectConfig(null);
  }, []);

  // Compute current running streak for game feel feedback
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = state.currentIndex - 1; i >= 0; i--) {
      if (state.answers[i] === state.questions[i]?.correctIndex) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [state.currentIndex, state.answers, state.questions]);

  // Show Quick Play result screen
  if (state.isComplete && selectedMode === 'quick-play') {
    return <QuizResult result={getResult()} onRetry={handleRetry} />;
  }

  // Show Quick Play quiz in progress
  if (state.isActive && currentQuestion && selectedMode === 'quick-play') {
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
                <h1 className="font-semibold truncate flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Quick Play
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
            currentStreak={currentStreak}
          />
        </div>
      </div>
    );
  }

  // Show Time Attack mode
  if (step === 'playing' && selectedMode === 'time-attack' && subjectConfig) {
    return (
      <TimeAttackQuiz
        subject={subjectConfig.subject}
        onComplete={handleTimeAttackComplete}
        onExit={handleExitSpecialMode}
      />
    );
  }

  // Show Survival mode
  if (step === 'playing' && selectedMode === 'survival' && subjectConfig) {
    return (
      <SurvivalQuiz
        subject={subjectConfig.subject}
        onComplete={handleSurvivalComplete}
        onExit={handleExitSpecialMode}
      />
    );
  }

  // Show Focus Drill mode
  if (step === 'playing' && selectedMode === 'focus-drill' && subjectConfig) {
    return (
      <FocusDrillQuiz
        subject={subjectConfig.subject}
        questionCount={subjectConfig.questionCount}
        difficulty={subjectConfig.difficulty}
        onComplete={handleFocusDrillComplete}
        onExit={handleExitSpecialMode}
      />
    );
  }

  // Show subject selection
  if (step === 'subject-select' && selectedMode) {
    const modeConfig = QUIZ_MODES[selectedMode];
    const ModeIcon = selectedMode === 'quick-play' ? Zap : 
                     selectedMode === 'focus-drill' ? Target :
                     selectedMode === 'time-attack' ? Flame : Skull;

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
                <h1 className="font-semibold flex items-center gap-2">
                  <ModeIcon className="w-5 h-5 text-primary" />
                  {modeConfig.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Choose a subject to start
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="max-w-lg mx-auto px-4 py-6">
          <SubjectSelector
            mode={selectedMode}
            onStart={handleSubjectStart}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  // Show mode selection (default)
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Quiz Modes
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose your challenge • Earn XP
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <QuizModeSelector onModeSelect={handleModeSelect} />
        
        {/* Info Card */}
        <div className="mt-6 glass rounded-2xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-success">★</span>
            XP-Only Modes
          </h3>
          <p className="text-sm text-muted-foreground">
            All quiz modes reward XP for badges, levels, and streaks. 
            Your leaderboard rank is only affected by <strong>Ranked PvP</strong> and <strong>Daily Challenges</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
