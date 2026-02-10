import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Zap, CheckCircle, ChevronRight, Flame, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-warning/5 border-primary/30 game-card">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-warning/5" />
        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Daily Challenge</h3>
              <p className="text-sm text-muted-foreground">Sign in to compete!</p>
            </div>
          </div>
          <Link to="/login">
            <Button className="w-full mt-2 game-tap">
              Sign In to Play
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-32 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="h-10 bg-muted rounded" />
      </Card>
    );
  }

  const isCompleted = challengeData?.completed;
  const attempt = challengeData?.attempt;

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all game-card",
      isCompleted 
        ? "bg-gradient-to-br from-success/10 via-card to-success/5 border-success/30"
        : "bg-gradient-to-br from-primary/10 via-card to-warning/5 border-primary/30 glow-cta"
    )}>
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-warning rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110",
              isCompleted 
                ? "bg-gradient-to-br from-success to-success/70"
                : "bg-gradient-to-br from-primary to-primary/70 animate-pulse-slow"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-6 h-6 text-success-foreground" />
              ) : (
                <Trophy className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">Today's Challenge</h3>
                <Badge variant="secondary" className="text-xs">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isCompleted ? '✅ Challenge completed!' : '⚔️ Compete for the top spot!'}
              </p>
            </div>
          </div>
        </div>

        {isCompleted && attempt ? (
          <>
            {/* Completed Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 stagger-children">
              <div className="glass rounded-lg p-3 text-center game-tap">
                <div className="flex items-center justify-center gap-1 text-warning mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">#{challengeData?.rank || '-'}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <div className="glass rounded-lg p-3 text-center game-tap">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{attempt.score}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="glass rounded-lg p-3 text-center game-tap">
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{Math.round(attempt.accuracy)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link to="/daily-challenge/leaderboard" className="flex-1">
                <Button variant="default" className="w-full game-tap">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Leaderboard
                </Button>
              </Link>
            </div>

            {/* Next Challenge Timer */}
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 animate-pulse-slow" />
              <span>Next challenge in {timeUntilReset}</span>
            </div>
          </>
        ) : (
          <>
            {/* Challenge Info */}
            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-warning animate-streak-fire" />
                <span>{challengeData?.challenge?.totalQuestions || 10} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{Math.floor((challengeData?.challenge?.timeLimit || 600) / 60)} min limit</span>
              </div>
            </div>

            {/* Start Button — glowing CTA */}
            <Link to="/daily-challenge">
              <Button size="lg" className="w-full h-12 text-base font-semibold shadow-md glow-cta game-tap">
                <Zap className="w-5 h-5 mr-2" />
                Start Challenge
                <ChevronRight className="w-5 h-5 ml-auto" />
              </Button>
            </Link>

            {/* Reset Timer */}
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 animate-pulse-slow" />
              <span>Resets in {timeUntilReset}</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
