import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Trophy, 
  Target, 
  Zap, 
  Calendar,
  ChevronRight,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from '@/components/TierBadge';
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

  const stats = [
    { icon: Trophy, label: 'Total Points', value: user.points.toLocaleString(), color: 'text-warning' },
    { icon: Target, label: 'Accuracy', value: `${user.accuracy}%`, color: 'text-success' },
    { icon: Zap, label: 'Quizzes Taken', value: user.totalQuizzes, color: 'text-primary' },
    { icon: Calendar, label: 'Joined', value: 'Jan 2024', color: 'text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <section className="relative overflow-hidden px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-warning/5" />
        
        <div className="relative container max-w-lg mx-auto text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <TierBadge tier={user.tier} size="md" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
          <p className="text-muted-foreground mb-4">
            {user.countryFlag} {user.country} • Rank #{user.rank}
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "glass rounded-xl p-4 animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">🏅 Badges</h2>
            <span className="text-sm text-muted-foreground">
              {user.badges.length} earned
            </span>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-4">
              {user.badges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center mb-1">
                    <span className="text-2xl">{badge.icon}</span>
                  </div>
                  <span className="text-[10px] text-center font-medium truncate w-full">
                    {badge.name}
                  </span>
                </div>
              ))}
              {/* Locked badge placeholder */}
              <div className="flex flex-col items-center opacity-40">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-1">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-center text-muted-foreground">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">🎯 Achievements</h2>
          </div>

          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={cn(
                  "glass rounded-xl p-4 animate-fade-in",
                  !achievement.unlocked && "opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    achievement.unlocked 
                      ? "bg-gradient-to-br from-warning/20 to-warning/5" 
                      : "bg-muted"
                  )}>
                    {achievement.unlocked ? (
                      <span className="text-2xl">{achievement.icon}</span>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      {achievement.unlocked && (
                        <span className="text-xs text-success">✓ Completed</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
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
      <section className="px-4 py-6">
        <div className="container max-w-lg mx-auto">
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-primary/10" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <h3 className="font-bold text-lg">Go Premium</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited AI tools, advanced analytics, and remove ads
              </p>
              <Button variant="warning" size="sm">
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
