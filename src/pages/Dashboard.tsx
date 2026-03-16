import { Link } from 'react-router-dom';
import { Trophy, Target, Zap, Flame, Swords, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/contexts/AuthContext';
import { DailyChallengeCard } from '@/components/daily-challenge/DailyChallengeCard';
import { RankProgress } from '@/components/dashboard/RankProgress';
import { MysteryBoxCard } from '@/components/dashboard/MysteryBoxCard';
import { DailyRewardsStreak } from '@/components/dashboard/DailyRewardsStreak';
import { FriendActivity } from '@/components/dashboard/FriendActivity';
import { LivePvPCard } from '@/components/dashboard/LivePvPCard';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { profile, isAuthenticated } = useAuth();

  if (!isAuthenticated || !profile) return null;

  return (
    <div className="pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ── Greeting ── */}
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Avatar className="h-11 w-11 border-2 border-primary/20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {(profile.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">Hi, {profile.username || 'User'} 👋</h1>
            <div className="flex items-center gap-2">
              <TierBadge tier={profile.tier} size="sm" />
              {profile.current_streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-warning font-medium">
                  <Flame className="h-3.5 w-3.5" />
                  {profile.current_streak}d streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Rank Progress ── */}
        <RankProgress />

        {/* ── Primary CTA ── */}
        <div className="space-y-2">
          <Link to="/quiz" className="block">
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl game-tap shadow-md"
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/pvp">
              <Button variant="outline" className="w-full h-11 rounded-xl game-tap text-sm">
                <Swords className="h-4 w-4 mr-1.5" />
                PvP Arena
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" className="w-full h-11 rounded-xl game-tap text-sm">
                <Trophy className="h-4 w-4 mr-1.5" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Points', value: profile.total_points.toLocaleString(), icon: Trophy, color: 'text-warning' },
            { label: 'Accuracy', value: `${Math.round(profile.accuracy)}%`, icon: Target, color: 'text-success' },
            { label: 'Quizzes', value: profile.total_quizzes_completed, icon: BookOpen, color: 'text-primary' },
            { label: 'Streak', value: `${profile.current_streak}d`, icon: Flame, color: 'text-warning' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-2.5 text-center">
              <stat.icon className={cn("h-3.5 w-3.5 mx-auto mb-1", stat.color)} />
              <p className="text-sm font-bold leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Daily Challenge ── */}
        <DailyChallengeCard />

        {/* ── Retention: Mystery Box + Daily Rewards ── */}
        <div className="grid grid-cols-1 gap-3">
          <MysteryBoxCard />
          <DailyRewardsStreak />
        </div>

        {/* ── Live PvP ── */}
        <LivePvPCard />

        {/* ── Friend Activity ── */}
        <FriendActivity />
      </div>
    </div>
  );
};
