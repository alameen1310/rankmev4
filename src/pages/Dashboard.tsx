import { Link } from 'react-router-dom';
import { Trophy, Target, Zap, TrendingUp, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { StreakCounter } from '@/components/StreakCounter';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { subjects, leaderboardData } from '@/data/mockData';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const userRankEntry = leaderboardData.find(e => e.rank === user.rank);
  const nearbyRanks = leaderboardData.slice(
    Math.max(0, user.rank - 3),
    Math.min(leaderboardData.length, user.rank + 2)
  );

  return (
    <div className="min-h-screen pb-4">
      {/* Welcome Section */}
      <section className="relative overflow-hidden px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-warning/5" />
        
        <div className="relative container max-w-lg mx-auto">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{user.username}</h1>
                  <TierBadge tier={user.tier} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ranked #{user.rank} globally
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-warning">
                  <Flame className="h-5 w-5 animate-streak-fire" />
                  <span className="text-xl font-bold">{user.streak}</span>
                </div>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 py-2">
        <div className="container max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Trophy}
              label="Total Points"
              value={user.points.toLocaleString()}
              iconColor="text-warning"
            />
            <StatCard
              icon={Target}
              label="Accuracy"
              value={`${user.accuracy}%`}
              iconColor="text-success"
            />
            <StatCard
              icon={Zap}
              label="Quizzes"
              value={user.totalQuizzes}
              iconColor="text-primary"
            />
            <StatCard
              icon={TrendingUp}
              label="This Week"
              value="+2,450"
              subValue="↑ 15%"
              iconColor="text-success"
            />
          </div>
        </div>
      </section>

      {/* Streak Counter */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <StreakCounter streak={user.streak} />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex gap-3">
            <Link to="/quiz" className="flex-1">
              <Button variant="hero" size="lg" className="w-full">
                <Zap className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg">
                <Trophy className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby Ranks */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Your Position</h2>
            <Link to="/leaderboard" className="text-sm text-primary font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
            {nearbyRanks.map((entry) => {
              const isUser = entry.rank === user.rank;
              
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    isUser && "bg-primary/10"
                  )}
                >
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    #{entry.rank}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium truncate", isUser && "text-primary")}>
                        {isUser ? 'You' : entry.username}
                      </span>
                      {isUser && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold">{entry.points.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Popular Subjects</h2>
            <Link to="/quiz" className="text-sm text-primary font-medium flex items-center">
              All Subjects <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {subjects.slice(0, 4).map((subject, index) => (
              <Link
                key={subject.id}
                to={`/quiz/${subject.id}`}
                className={cn(
                  "glass rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-2xl mb-2 block">{subject.icon}</span>
                <h3 className="font-semibold">{subject.name}</h3>
                <p className="text-xs text-muted-foreground">{subject.questionsCount} questions</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="px-4 py-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Recent Badges</h2>
            <Link to="/profile" className="text-sm text-primary font-medium flex items-center">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {user.badges.slice(0, 5).map((badge) => (
              <div
                key={badge.id}
                className="glass rounded-xl p-3 flex flex-col items-center min-w-[80px]"
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs font-medium text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
