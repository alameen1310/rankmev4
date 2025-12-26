import { Link } from 'react-router-dom';
import { Trophy, Zap, Target, Users, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { leaderboardData } from '@/data/mockData';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Trophy,
    title: 'Global Rankings',
    description: 'Compete with students worldwide and climb the leaderboard',
    color: 'text-warning',
  },
  {
    icon: Zap,
    title: 'Quick Quizzes',
    description: 'Timed challenges that test your knowledge and speed',
    color: 'text-primary',
  },
  {
    icon: Target,
    title: 'Track Progress',
    description: 'Monitor your improvement with detailed analytics',
    color: 'text-success',
  },
  {
    icon: Users,
    title: 'Challenge Friends',
    description: 'Battle your classmates in real-time PvP quizzes',
    color: 'text-destructive',
  },
];

export const Landing = () => {
  const topRankers = leaderboardData.slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5" />
        
        <div className="relative container max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Star className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Join 50,000+ Students</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in-up">
            Study. Compete.{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Rank.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Transform studying into an addictive game. Climb the leaderboard, earn badges, and become a quiz champion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Get Started Free
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-12 px-4">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">🏆 Global Rankings</h2>
              <p className="text-sm text-muted-foreground">Today's top performers</p>
            </div>
            <Link to="/leaderboard" className="text-sm text-primary font-medium hover:underline">
              View All
            </Link>
          </div>

          <div className="glass rounded-2xl overflow-hidden divide-y divide-border">
            {topRankers.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 p-4 animate-fade-in",
                  index === 0 && "bg-gradient-to-r from-warning/10 to-transparent"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 text-center">
                  {index === 0 && <span className="text-xl">🥇</span>}
                  {index === 1 && <span className="text-xl">🥈</span>}
                  {index === 2 && <span className="text-xl">🥉</span>}
                  {index > 2 && <span className="font-bold text-muted-foreground">#{entry.rank}</span>}
                </div>

                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.username}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{entry.countryFlag}</span>
                    <TierBadge tier={entry.tier} size="sm" showLabel={false} />
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold">{entry.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="container max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Why RankMe?</h2>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-4 flex gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-primary/10 to-primary/5"
                )}>
                  <feature.icon className={cn("h-6 w-6", feature.color)} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container max-w-lg mx-auto text-center">
          <div className="glass rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-warning/10" />
            
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">Ready to rank up?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of students competing to be the best
              </p>
              
              <Link to="/signup">
                <Button variant="hero" size="lg">
                  Start Learning Now
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container max-w-lg mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 RankMe. Study smarter, rank higher.</p>
        </div>
      </footer>
    </div>
  );
};
