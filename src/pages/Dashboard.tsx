import { Link } from 'react-router-dom';
import { Trophy, Target, Zap, TrendingUp, ChevronRight, Flame, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { StreakCounter } from '@/components/StreakCounter';
import { StatCard } from '@/components/StatCard';
import { CircularProgress } from '@/components/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { subjects, leaderboardData } from '@/data/mockData';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const nearbyRanks = leaderboardData.slice(
    Math.max(0, user.rank - 3),
    Math.min(leaderboardData.length, user.rank + 2)
  );

  // Mock weekly progress
  const weeklyProgress = 65;

  return (
    <div className="min-h-screen pb-4">
      {/* Welcome Section */}
      <section className="relative overflow-hidden px-4 py-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-3 border-primary/30 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg font-bold truncate">{user.username}</h1>
                  <TierBadge tier={user.tier} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ranked <span className="font-semibold text-foreground">#{user.rank}</span> globally
                </p>
              </div>

              <div className="text-center shrink-0">
                <div className="flex items-center justify-center gap-1 text-warning">
                  <Flame className="h-5 w-5 animate-streak-fire" />
                  <span className="text-xl font-bold">{user.streak}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid - Equal Height */}
      <section className="px-4 py-2">
        <div className="max-w-lg mx-auto">
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
              label="Quizzes Taken"
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

      {/* Weekly Progress + Streak */}
      <section className="px-4 py-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {/* Weekly Progress */}
          <div className="glass rounded-2xl p-4 flex flex-col items-center justify-center">
            <CircularProgress 
              value={weeklyProgress} 
              size="md" 
              color="primary"
            />
            <span className="text-xs text-muted-foreground mt-2 text-center">Weekly Goal</span>
          </div>
          
          {/* Streak Counter - Takes 2 columns */}
          <div className="col-span-2">
            <StreakCounter streak={user.streak} />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-3">
            <Link to="/quiz" className="flex-1">
              <Button variant="default" size="lg" className="w-full h-12 shadow-md">
                <Zap className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-4">
              <Share2 className="h-5 w-5" />
            </Button>
            <Link to="/leaderboard">
              <Button variant="outline" size="lg" className="h-12 px-4">
                <Trophy className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          {/* Continue Learning */}
          <Link to="/quiz/math" className="block mt-3">
            <div className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🧮</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Continue Mathematics</p>
                <p className="text-xs text-muted-foreground">65% complete</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </section>

      {/* Nearby Ranks */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Your Position</h2>
            <Link to="/leaderboard" className="text-sm text-primary font-medium flex items-center touch-target">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass rounded-2xl divide-y divide-border/50 overflow-hidden">
            {nearbyRanks.map((entry) => {
              const isUser = entry.rank === user.rank;
              
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-3 touch-target",
                    isUser && "bg-primary/8"
                  )}
                >
                  <div className="w-8 text-center font-bold text-sm text-muted-foreground">
                    #{entry.rank}
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm truncate", isUser && "text-primary")}>
                        {isUser ? 'You' : entry.username}
                      </span>
                      {isUser && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-sm">{entry.points.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Popular Subjects</h2>
            <Link to="/quiz" className="text-sm text-primary font-medium flex items-center touch-target">
              All Subjects <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {subjects.slice(0, 4).map((subject, index) => (
              <Link
                key={subject.id}
                to={`/quiz/${subject.id}`}
                className={cn(
                  "glass rounded-xl p-4 transition-all active:scale-[0.98]",
                  "animate-fade-in min-h-[100px]"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-2xl mb-2 block">{subject.icon}</span>
                <h3 className="font-semibold text-sm">{subject.name}</h3>
                <p className="text-xs text-muted-foreground">{subject.questionsCount} Qs</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Badges */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Recent Badges</h2>
            <Link to="/profile" className="text-sm text-primary font-medium flex items-center touch-target">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto scroll-x pb-2 -mx-4 px-4">
            {user.badges.slice(0, 5).map((badge) => (
              <div
                key={badge.id}
                className="glass rounded-xl p-3 flex flex-col items-center min-w-[72px] shrink-0"
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-[10px] font-medium text-center leading-tight">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};