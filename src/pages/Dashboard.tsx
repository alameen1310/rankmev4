import { Link } from 'react-router-dom';
import { Trophy, Target, Zap, Flame, ChevronRight, Swords, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/contexts/AuthContext';
import { DailyChallengeCard } from '@/components/daily-challenge/DailyChallengeCard';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { profile, isAuthenticated } = useAuth();

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Greeting — compact, personal */}
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Avatar className="h-11 w-11 border-2 border-border">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {(profile.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Hi, {profile.username || 'User'}</h1>
            <div className="flex items-center gap-2">
              <TierBadge tier={profile.tier} size="sm" />
              {profile.current_streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-warning font-medium">
                  <Flame className="h-3.5 w-3.5" />
                  {profile.current_streak}d
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary CTA — Play */}
        <div className="space-y-2">
          <Link to="/quiz" className="block">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-xl game-tap">
              <Zap className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/pvp">
              <Button variant="outline" size="lg" className="w-full h-12 rounded-xl game-tap">
                <Swords className="h-4 w-4 mr-2" />
                PvP Arena
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="w-full h-12 rounded-xl game-tap">
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row — compact horizontal */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Points', value: profile.total_points.toLocaleString(), icon: Trophy, color: 'text-warning' },
            { label: 'Accuracy', value: `${Math.round(profile.accuracy)}%`, icon: Target, color: 'text-success' },
            { label: 'Quizzes', value: profile.total_quizzes_completed, icon: BookOpen, color: 'text-primary' },
            { label: 'Streak', value: `${profile.current_streak}d`, icon: Flame, color: 'text-warning' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
              <p className="text-sm font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Daily Challenge */}
        <DailyChallengeCard />

        {/* Quick Resume */}
        <Link to="/quiz/mathematics" className="block">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 game-card game-tap">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg">🧮</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Continue Mathematics</p>
              <p className="text-xs text-muted-foreground">Pick up where you left off</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </Link>
      </div>
    </div>
  );
};
