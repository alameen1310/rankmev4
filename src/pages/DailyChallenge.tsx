import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, XCircle, Trophy, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getDailyChallenge, 
  submitDailyChallenge, 
  type DailyChallengeQuestion,
  type SubmitResponse 
} from '@/services/dailyChallenge';
import { Confetti } from '@/components/Confetti';
import { toast } from 'sonner';

type ChallengeState = 'loading' | 'ready' | 'playing' | 'completed' | 'already_completed' | 'error';

interface Answer {
  questionId: number;
  selectedAnswer: number;
  timeSpent: number;
}

export function DailyChallenge() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [state, setState] = useState<ChallengeState>('loading');
  const [questions, setQuestions] = useState<DailyChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [totalTime, setTotalTime] = useState(0);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<any>(null);
  const [existingRank, setExistingRank] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadChallenge();
  }, [isAuthenticated]);

  // Timer countdown
  useEffect(() => {
    if (state !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeLeft]);

  const loadChallenge = async () => {
    try {
      const data = await getDailyChallenge();
      
      if (data.completed && data.attempt) {
        setState('already_completed');
        setExistingAttempt(data.attempt);
        setExistingRank(data.rank || null);
      } else if (data.challenge?.questions) {
        setQuestions(data.challenge.questions);
        setTimeLeft(data.challenge.timeLimit);
        setState('ready');
      } else {
        setState('error');
      }
    } catch (error) {
      console.error('Failed to load challenge:', error);
      setState('error');
    }
  };

  const startChallenge = () => {
    setState('playing');
    setQuestionStartTime(Date.now());
  };

  const handleTimeUp = useCallback(async () => {
    // Fill remaining answers as skipped (wrong)
    const currentAnswers = [...answers];
    for (let i = currentAnswers.length; i < questions.length; i++) {
      currentAnswers.push({
        questionId: questions[i].id,
        selectedAnswer: -1, // Invalid answer
        timeSpent: 0,
      });
    }
    
    await submitAnswers(currentAnswers, 600);
  }, [answers, questions]);

  const handleAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const newAnswer: Answer = {
      questionId: questions[currentIndex].id,
      selectedAnswer: optionIndex,
      timeSpent,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
        setQuestionStartTime(Date.now());
      } else {
        // Last question - submit
        submitAnswers(newAnswers, 600 - timeLeft);
      }
    }, 1000);
  };

  const submitAnswers = async (finalAnswers: Answer[], finalTime: number) => {
    setState('loading');
    setTotalTime(finalTime);

    try {
      const result = await submitDailyChallenge(finalAnswers, finalTime);
      setResult(result);
      setState('completed');
      
      if (result.percentile >= 50) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error: any) {
      console.error('Failed to submit:', error);
      toast.error(error.message || 'Failed to submit challenge');
      setState('error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load the daily challenge. Please try again later.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Already completed state
  if (state === 'already_completed' && existingAttempt) {
    return (
      <div className="min-h-screen">
        <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold">Daily Challenge</h1>
                <p className="text-xs text-muted-foreground">Already completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="p-6 text-center bg-gradient-to-br from-success/10 to-card">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Challenge Completed!</h2>
            <p className="text-muted-foreground mb-6">
              You've already completed today's challenge. Come back tomorrow!
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass rounded-lg p-4">
                <Trophy className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold">#{existingRank || '-'}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <div className="glass rounded-lg p-4">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{existingAttempt.score}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="glass rounded-lg p-4">
                <Target className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">{Math.round(existingAttempt.accuracy)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => navigate('/dashboard')}
              >
                Back Home
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate('/daily-challenge/leaderboard')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Ready state - show start screen
  if (state === 'ready') {
    return (
      <div className="min-h-screen">
        <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold">Daily Challenge</h1>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-card">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Ready to Compete?</h2>
            <p className="text-muted-foreground mb-6">
              Test your knowledge against other players with today's challenge!
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass rounded-lg p-4">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-2xl font-bold text-warning">{formatTime(timeLeft)}</p>
                <p className="text-sm text-muted-foreground">Time Limit</p>
              </div>
            </div>

            <div className="glass rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Important Rules
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You can only attempt once per day</li>
                <li>• Faster answers = higher score</li>
                <li>• Everyone gets the same questions</li>
                <li>• Your rank updates in real-time</li>
              </ul>
            </div>

            <Button 
              size="lg" 
              className="w-full h-12 text-base font-semibold"
              onClick={startChallenge}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Challenge
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Playing state
  if (state === 'playing' && currentQuestion) {
    const options = [
      { label: 'A', text: currentQuestion.option_a },
      { label: 'B', text: currentQuestion.option_b },
      { label: 'C', text: currentQuestion.option_c },
      { label: 'D', text: currentQuestion.option_d },
    ];

    const correctAnswer = ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correct_answer || 'A');

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentIndex + 1}/{questions.length}
              </span>
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-muted"
              )}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
            <Progress value={(currentIndex / questions.length) * 100} className="h-2" />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <Card className="p-5 mb-6">
            <p className="text-lg font-medium leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = showFeedback && index === correctAnswer;
              const isWrong = showFeedback && isSelected && index !== correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                    !showFeedback && "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                    isCorrect && "border-success bg-success/10",
                    isWrong && "border-destructive bg-destructive/10",
                    !isCorrect && !isWrong && isSelected && "border-primary bg-primary/10",
                    !isCorrect && !isWrong && !isSelected && "border-border bg-card"
                  )}
                >
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                    isCorrect ? "bg-success text-success-foreground" :
                    isWrong ? "bg-destructive text-destructive-foreground" :
                    isSelected ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isCorrect ? <CheckCircle className="w-4 h-4" /> :
                     isWrong ? <XCircle className="w-4 h-4" /> :
                     option.label}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (state === 'completed' && result) {
    return (
      <div className="min-h-screen">
        {showConfetti && <Confetti isActive={showConfetti} />}
        
        <div className="glass-strong sticky top-14 z-40 border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3">
            <h1 className="font-semibold text-center">Challenge Complete!</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-card mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy className="w-10 h-10 text-warning-foreground" />
            </div>

            <h2 className="text-2xl font-bold mb-1">Rank #{result.rank}</h2>
            <p className="text-lg text-success font-medium mb-6">
              {result.message}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass rounded-lg p-4">
                <p className="text-2xl font-bold text-primary">{result.attempt.score}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-2xl font-bold text-success">
                  {result.attempt.correct_answers}/{result.attempt.total_questions}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-2xl font-bold text-warning">
                  {formatTime(result.attempt.time_taken_seconds)}
                </p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="glass rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="font-semibold">{Math.round(result.attempt.accuracy)}%</span>
              </div>
              <Progress value={result.attempt.accuracy} className="h-2" />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => navigate('/dashboard')}
              >
                Back Home
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate('/daily-challenge/leaderboard')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}