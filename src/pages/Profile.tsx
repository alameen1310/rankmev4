import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Trophy, Zap, Calendar, ChevronRight, Share2, Star, Gift, Shield, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { CircularProgress } from '@/components/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useGameState } from '@/contexts/GameStateContext';
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase';
import { StreakCounter } from '@/components/StreakCounter';
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

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Use user-specific folder path for RLS policy compliance
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: 'Profile picture updated!',
        description: 'Your avatar has been changed successfully',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-safe-bottom">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Profile Header */}
      <section className="relative overflow-hidden px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto text-center">
          <div className="relative inline-block mb-3">
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="relative group cursor-pointer"
            >
              <Avatar className="h-20 w-20 border-4 border-primary/30">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {(profile.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </button>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <TierBadge tier={profile.tier} size="sm" />
            </div>
          </div>

          <h1 className="text-xl font-bold mb-0.5">
            {profile.username || 'User'}
            {state.equippedTitle && (
              <span className="text-primary font-normal text-base ml-2">
                • {state.equippedTitle}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            🌍 {profile.country || 'Global'} • {profile.tier} tier
            {state.rank && <> • Rank #{state.rank.toLocaleString()}</>}
          </p>

          <div className="flex justify-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {isSuperAdmin && (
              <Button 
                variant="default" 
                size="sm" 
                className="min-h-[44px] bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/admin')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
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

      {/* Badge Showcase */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <BadgeShowcase editable />
        </div>
      </section>

      {/* Streak Counter */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <StreakCounter streak={profile.current_streak} />
        </div>
      </section>

      {/* View Rewards */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Link to="/gamification">
            <div className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors">
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
              <Button 
                className="w-full bg-warning text-warning-foreground hover:bg-warning/90 min-h-[48px] shadow-md"
                onClick={() => navigate('/themes')}
              >
                Browse Themes & Premium
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};