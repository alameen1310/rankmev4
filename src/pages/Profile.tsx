import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Trophy, Zap, Calendar, ChevronRight, Shield, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useGameState } from '@/contexts/GameStateContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const Profile = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const { state } = useGameState();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!profile) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, GIF, or WebP image', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: 'Profile picture updated!' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const stats = [
    { label: 'Accuracy', value: `${Math.round(profile.accuracy)}%`, icon: '🎯' },
    { label: 'Points', value: `${(profile.total_points / 1000).toFixed(1)}k`, icon: '⭐' },
    { label: 'Quizzes', value: profile.total_quizzes_completed, icon: '📝' },
    { label: 'Streak', value: `${profile.current_streak}d`, icon: '🔥' },
  ];

  return (
    <div className="pb-8">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarUpload} className="hidden" />

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Profile header */}
        <div className="text-center">
          <button onClick={handleAvatarClick} disabled={isUploading} className="relative group inline-block mb-3">
            <Avatar className="h-20 w-20 border-2 border-border">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(profile.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-foreground/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? <Loader2 className="h-5 w-5 text-background animate-spin" /> : <Camera className="h-5 w-5 text-background" />}
            </div>
          </button>

          <h1 className="text-xl font-bold">{profile.username || 'User'}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TierBadge tier={profile.tier} size="sm" />
            <span className="text-sm text-muted-foreground">
              {profile.country || 'Global'}
              {state.rank && <> · #{state.rank.toLocaleString()}</>}
            </span>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-1.5" /> Settings
            </Button>
            {isSuperAdmin && (
              <Button size="sm" onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4 mr-1.5" /> Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <span className="text-base">{stat.icon}</span>
              <p className="text-sm font-bold mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="space-y-2">
          <Link to="/gamification">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 game-card">
              <span className="text-lg">🏆</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Rewards & Badges</p>
                <p className="text-xs text-muted-foreground">View your achievements</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link to="/themes">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 game-card">
              <span className="text-lg">👑</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Premium</p>
                <p className="text-xs text-muted-foreground">Unlock themes & features</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
