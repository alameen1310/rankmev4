import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Trophy, Zap, Calendar, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { CircularProgress } from '@/components/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';

export const Profile = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-safe-bottom">
      {/* Profile Header */}
      <section className="relative overflow-hidden px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto text-center">
          <div className="relative inline-block mb-3">
            <Avatar className="h-20 w-20 border-4 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(profile.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <TierBadge tier={profile.tier} size="sm" />
            </div>
          </div>

          <h1 className="text-xl font-bold mb-0.5">{profile.username || 'User'}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            🌍 {profile.country || 'Global'} • {profile.tier} tier
          </p>

          <div className="flex justify-center gap-2">
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4 shadow-md">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center">
                <CircularProgress value={Math.round(profile.accuracy)} size="sm" color="success" />
                <span className="text-[10px] text-muted-foreground mt-1.5">Accuracy</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <span className="text-sm font-bold mt-1">{(profile.total_points / 1000).toFixed(1)}k</span>
                <span className="text-[10px] text-muted-foreground">Points</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold mt-1">{profile.total_quizzes_completed}</span>
                <span className="text-[10px] text-muted-foreground">Quizzes</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold mt-1">{profile.current_streak}</span>
                <span className="text-[10px] text-muted-foreground">Streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="px-4 py-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/15 to-primary/10" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👑</span>
                <h3 className="font-bold">Go Premium</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited AI tools, advanced analytics, and ad-free experience
              </p>
              <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90 min-h-[48px] shadow-md">
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