import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Trophy, 
  Target, 
  Zap, 
  Calendar,
  ChevronRight,
  Lock,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from '@/components/TierBadge';
import { CircularProgress } from '@/components/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { achievements } from '@/data/mockData';
import { cn } from '@/lib/utils';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <section className="relative overflow-hidden px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto text-center">
          <div className="relative inline-block mb-3">
            <Avatar className="h-20 w-20 border-4 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <TierBadge tier={user.tier} size="sm" />
            </div>
          </div>

          <h1 className="text-xl font-bold mb-0.5">{user.username}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {user.countryFlag} {user.country} • Rank #{user.rank}
          </p>

          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" className="h-9 touch-target">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="h-9 touch-target">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="h-9 touch-target" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats with Circular Progress */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={user.accuracy} 
                  size="sm" 
                  color="success"
                />
                <span className="text-[10px] text-muted-foreground mt-1.5">Accuracy</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <span className="text-sm font-bold mt-1">{(user.points / 1000).toFixed(1)}k</span>
                <span className="text-[10px] text-muted-foreground">Points</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold mt-1">{user.totalQuizzes}</span>
                <span className="text-[10px] text-muted-foreground">Quizzes</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold mt-1">Jan</span>
                <span className="text-[10px] text-muted-foreground">Joined</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges - 3 Column Grid */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              🏅 Badges
              <span className="text-xs font-normal text-muted-foreground">
                {user.badges.length} earned
              </span>
            </h2>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4">
              {user.badges.map((badge, index) => (
                <div 
                  key={badge.id} 
                  className="flex flex-col items-center animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center mb-1.5 shadow-sm">
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <span className="text-[10px] text-center font-medium leading-tight line-clamp-2">
                    {badge.name}
                  </span>
                </div>
              ))}
              
              {/* Locked badges */}
              {[1, 2].map((i) => (
                <div key={`locked-${i}`} className="flex flex-col items-center opacity-40">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-1.5">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] text-center text-muted-foreground">
                    Locked
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements with Progress */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            🎯 Achievements
          </h2>

          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={cn(
                  "glass rounded-xl p-4 animate-fade-in",
                  !achievement.unlocked && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                    achievement.unlocked 
                      ? "bg-gradient-to-br from-warning/20 to-warning/5" 
                      : "bg-muted"
                  )}>
                    {achievement.unlocked ? (
                      <span className="text-xl">{achievement.icon}</span>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm">{achievement.name}</h3>
                      {achievement.unlocked && (
                        <span className="text-[10px] text-success font-medium">✓ Done</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-1.5 flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="px-4 py-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/15 to-primary/10" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👑</span>
                <h3 className="font-bold">Go Premium</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited AI tools, advanced analytics, and ad-free experience
              </p>
              <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90 h-11 touch-target">
                Upgrade for $0.99/month
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};