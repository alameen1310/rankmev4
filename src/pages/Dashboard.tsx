import { Link } from 'react-router-dom';
import { Trophy, Target, Zap, TrendingUp, ChevronRight, Flame, Share2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { StreakCounter } from '@/components/StreakCounter';
import { StatCard } from '@/components/StatCard';
import { CircularProgress } from '@/components/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { TierProgress } from '@/components/gamification/TierProgress';
import { DailyRewards } from '@/components/gamification/DailyRewards';
import { BadgeCollection } from '@/components/gamification/BadgeCollection';
import { DailyChallengeCard } from '@/components/daily-challenge/DailyChallengeCard';
import { FriendSuggestions } from '@/components/social/FriendSuggestions';

export const Dashboard = () => {
  const { profile, isAuthenticated } = useAuth();

  if (!isAuthenticated || !profile) return null;

  const weeklyProgress = 65;

  return (
    <div className="min-h-screen pb-4 pattern-geometric">
      {/* Welcome Section — animated greeting */}
      <section className="relative overflow-hidden px-4 py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4 animate-slide-in-bottom game-card" style={{ animationDuration: '350ms' }}>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-3 border-primary/30 shrink-0 animate-scale-in">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />}
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {(profile.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg font-bold truncate animate-text-reveal">{profile.username || 'User'}</h1>
                  <TierBadge tier={profile.tier} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground animate-text-reveal" style={{ animationDelay: '100ms' }}>
                  Welcome back! 🎮
                </p>
              </div>

              <div className="text-center shrink-0 animate-bounce-in" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-center gap-1 text-warning">
                  <Flame className="h-5 w-5 animate-streak-fire" />
                  <span className="text-xl font-bold">{profile.current_streak}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Challenge — glowing CTA */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto animate-slide-in-bottom" style={{ animationDelay: '80ms' }}>
          <DailyChallengeCard />
        </div>
      </section>

      {/* Stats Grid — staggered entry */}
      <section className="px-4 py-2">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3 stagger-children">
            <StatCard
              icon={Trophy}
              label="Total Points"
              value={profile.total_points.toLocaleString()}
              iconColor="text-warning"
            />
            <StatCard
              icon={Target}
              label="Accuracy"
              value={`${Math.round(profile.accuracy)}%`}
              iconColor="text-success"
            />
            <StatCard
              icon={Zap}
              label="Quizzes Taken"
              value={profile.total_quizzes_completed}
              iconColor="text-primary"
            />
            <StatCard
              icon={TrendingUp}
              label="This Week"
              value={`+${profile.weekly_points.toLocaleString()}`}
              iconColor="text-success"
            />
          </div>
        </div>
      </section>

      {/* Weekly Progress + Streak */}
      <section className="px-4 py-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center game-card">
            <CircularProgress value={weeklyProgress} size="md" color="primary" />
            <span className="text-xs text-muted-foreground mt-2 text-center">Weekly Goal</span>
          </div>
          <div className="col-span-2 animate-slide-in-bottom" style={{ animationDelay: '160ms' }}>
            <StreakCounter streak={profile.current_streak} />
          </div>
        </div>
      </section>

      {/* Tier Progress */}
      <section className="px-4 py-2">
        <div className="max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
          <TierProgress points={profile.total_points} compact />
        </div>
      </section>

      {/* Quick Actions — glowing Play button */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto animate-slide-in-bottom" style={{ animationDelay: '240ms' }}>
          <div className="flex gap-3">
            <Link to="/quiz" className="flex-1">
              <Button variant="default" size="lg" className="w-full h-12 shadow-md glow-cta game-tap">
                <Zap className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-4 game-tap">
              <Share2 className="h-5 w-5" />
            </Button>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="h-12 px-4 game-tap">
                <Trophy className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <Link to="/quiz/mathematics" className="block mt-3">
            <div className="glass rounded-xl p-3 flex items-center gap-3 game-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🧮</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Continue Mathematics</p>
                <p className="text-xs text-muted-foreground">Start a quiz</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </section>

      {/* Daily Rewards */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
          <DailyRewards />
        </div>
      </section>

      {/* Friend Suggestions */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '360ms' }}>
          <FriendSuggestions compact />
        </div>
      </section>

      {/* Badge Collection Preview */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '420ms' }}>
          <BadgeCollection compact />
        </div>
      </section>

      {/* View All Rewards Link */}
      <section className="px-4 py-3 pb-8">
        <div className="max-w-lg mx-auto">
          <Link to="/gamification">
            <div className="glass rounded-xl p-4 flex items-center gap-3 game-card">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">View All Rewards</p>
                <p className="text-xs text-muted-foreground">Badges, Challenges & Titles</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};
