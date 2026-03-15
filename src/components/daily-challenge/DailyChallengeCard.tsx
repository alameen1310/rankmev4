import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Zap, CheckCircle, ChevronRight, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyChallenge, type DailyChallengeResponse } from '@/services/dailyChallenge';

export function DailyChallengeCard() {
  const { isAuthenticated } = useAuth();
  const [challengeData, setChallengeData] = useState<DailyChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadChallenge();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadChallenge = async () => {
    try {
      const data = await getDailyChallenge();
      setChallengeData(data);
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Daily Challenge</h3>
            <p className="text-xs text-muted-foreground">Sign in to compete</p>
          </div>
        </div>
        <Link to="/login">
          <Button size="sm" className="w-full">Sign In to Play</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-secondary" />
          <div className="flex-1">
            <div className="h-4 bg-secondary rounded w-28 mb-1.5" />
            <div className="h-3 bg-secondary rounded w-20" />
          </div>
        </div>
        <div className="h-10 bg-secondary rounded" />
      </div>
    );
  }

  const isCompleted = challengeData?.completed;
  const attempt = challengeData?.attempt;

  return (
    <div className={cn(
      "bg-card border rounded-xl p-4",
      isCompleted ? "border-success/30" : "border-primary/30"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isCompleted ? "bg-success/10" : "bg-primary/10"
          )}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <Trophy className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm">Today's Challenge</h3>
            <p className="text-xs text-muted-foreground">
              {isCompleted ? 'Completed!' : 'Compete for the top spot'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Badge>
      </div>

      {isCompleted && attempt ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-secondary rounded-lg p-2 text-center">
              <p className="text-sm font-bold">#{challengeData?.rank || '-'}</p>
              <p className="text-[10px] text-muted-foreground">Rank</p>
            </div>
            <div className="bg-secondary rounded-lg p-2 text-center">
              <p className="text-sm font-bold">{attempt.score}</p>
              <p className="text-[10px] text-muted-foreground">Score</p>
            </div>
            <div className="bg-secondary rounded-lg p-2 text-center">
              <p className="text-sm font-bold">{Math.round(attempt.accuracy)}%</p>
              <p className="text-[10px] text-muted-foreground">Accuracy</p>
            </div>
          </div>
          <Link to="/daily-challenge/leaderboard">
            <Button variant="outline" size="sm" className="w-full">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> View Leaderboard
            </Button>
          </Link>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Next challenge in {timeUntilReset}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-warning" />
              {challengeData?.challenge?.totalQuestions || 10} questions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {Math.floor((challengeData?.challenge?.timeLimit || 600) / 60)} min
            </span>
          </div>
          <Link to="/daily-challenge">
            <Button className="w-full game-tap">
              <Zap className="w-4 h-4 mr-1.5" /> Start Challenge
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Resets in {timeUntilReset}
          </p>
        </>
      )}
    </div>
  );
}
