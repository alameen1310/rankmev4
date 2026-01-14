import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap, Target, UserPlus, Swords, MessageCircle, Check, Clock, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { CircularProgress } from '@/components/CircularProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { getUserBadges, type UserBadge } from '@/services/badges';
import { getUserRank, getTierFromPoints } from '@/services/leaderboard';
import { BADGES, TITLES, RARITY_COLORS } from '@/services/gamification';
import { sendFriendRequest, getFriends } from '@/services/friends';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tier } from '@/types';

interface PublicUserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  tier: Tier;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  accuracy: number;
  total_quizzes_completed: number;
}

interface PublicProfileData {
  showcaseBadges: string[];
  equippedTitle: string | null;
}

type RelationshipStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received';

export const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [publicData, setPublicData] = useState<PublicProfileData>({ showcaseBadges: [], equippedTitle: null });
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [rank, setRank] = useState<{ rank: number; percentile: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('none');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
      if (user?.id && userId !== user.id) {
        checkRelationshipStatus();
      }
    }
  }, [userId, user?.id]);

  const checkRelationshipStatus = async () => {
    if (!user?.id || !userId) return;
    
    try {
      // Check if already friends
      const friends = await getFriends(user.id);
      if (friends.some(f => f.id === userId)) {
        setRelationshipStatus('friends');
        return;
      }
      
      // Check for pending friend requests
      const { data: sentRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (sentRequest) {
        setRelationshipStatus('pending_sent');
        return;
      }
      
      const { data: receivedRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('from_user_id', userId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (receivedRequest) {
        setRelationshipStatus('pending_received');
        return;
      }
      
      setRelationshipStatus('none');
    } catch (err) {
      console.error('Error checking relationship:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user?.id || !userId) return;
    
    setActionLoading('friend');
    try {
      await sendFriendRequest(user.id, userId);
      setRelationshipStatus('pending_sent');
      toast({
        title: 'Friend Request Sent!',
        description: `Request sent to ${profile?.display_name || profile?.username}`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to send request',
        description: err.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleChallengeToBattle = async () => {
    if (!user?.id || !userId) return;
    
    // Navigate to PvP lobby with friend challenge mode
    navigate('/pvp-lobby', { state: { challengeFriendId: userId, challengeFriendName: profile?.display_name || profile?.username } });
  };

  const handleSendMessage = () => {
    if (!userId) return;
    
    // Navigate to friends page with chat open
    navigate('/friends', { state: { openChatWith: userId } });
  };

  const fetchPublicProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (!profileData) {
        setError('User not found');
        setLoading(false);
        return;
      }
      
      const userProfile: PublicUserProfile = {
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        country: profileData.country,
        tier: (profileData.tier as Tier) || getTierFromPoints(profileData.total_points || 0),
        total_points: profileData.total_points || 0,
        current_streak: profileData.current_streak || 0,
        longest_streak: profileData.longest_streak || 0,
        accuracy: profileData.accuracy ? Number(profileData.accuracy) : 0,
        total_quizzes_completed: profileData.total_quizzes_completed || 0,
      };
      
      setProfile(userProfile);
      
      // Fetch user badges from database
      const badges = await getUserBadges(userId);
      setEarnedBadges(badges);
      
      // Fetch user rank
      const userRank = await getUserRank(userId);
      if (userRank) {
        setRank({ rank: userRank.rank, percentile: userRank.percentile });
      }
      
      // For now, showcase badges and title are stored in a simple way
      // In production, you'd have a public_profile_settings table
      // Here we'll calculate earned titles and show top badges
      const showcaseBadgeIds = badges.slice(0, 3).map(b => b.badge.name.toLowerCase().replace(/\s+/g, '-'));
      
      // Calculate equipped title from earned titles
      const earnedTitles = TITLES.filter(title => {
        switch (title.requirement.type) {
          case 'points':
            return userProfile.total_points >= title.requirement.value;
          case 'streak':
            return userProfile.current_streak >= title.requirement.value;
          case 'quizzes':
            return userProfile.total_quizzes_completed >= title.requirement.value;
          case 'accuracy':
            return userProfile.accuracy >= title.requirement.value;
          default:
            return false;
        }
      });
      
      // Get highest tier title
      const equippedTitle = earnedTitles.length > 0 
        ? earnedTitles.sort((a, b) => b.requirement.value - a.requirement.value)[0]?.name 
        : null;
      
      setPublicData({
        showcaseBadges: showcaseBadgeIds,
        equippedTitle,
      });
      
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-safe-bottom">
        <div className="px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pb-safe-bottom flex flex-col items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">{error || 'User not found'}</h2>
          <p className="text-muted-foreground mb-6">
            This profile may not exist or is not available.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || 'Anonymous';
  
  // Get showcase badges from earned badges
  const showcaseBadges = earnedBadges.slice(0, 3).map(ub => {
    // Try to match with local BADGES for rarity info
    const localBadge = BADGES.find(b => 
      b.name.toLowerCase() === ub.badge.name.toLowerCase()
    );
    return {
      ...ub.badge,
      rarity: localBadge?.rarity || 'common',
    };
  });

  return (
    <div className="min-h-screen pb-safe-bottom">
      {/* Header */}
      <div className="px-4 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Profile Header */}
      <section className="relative overflow-hidden px-4 py-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-warning/5" />
        
        <div className="relative max-w-lg mx-auto text-center">
          <div className="relative inline-block mb-3">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <TierBadge tier={profile.tier} size="sm" />
            </div>
          </div>

          <h1 className="text-xl font-bold mb-0.5">
            {displayName}
            {publicData.equippedTitle && (
              <span className="text-primary font-normal text-base ml-2">
                • {publicData.equippedTitle}
              </span>
            )}
          </h1>
          
          <p className="text-sm text-muted-foreground mb-2">
            🌍 {profile.country || 'Global'} • {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Tier
          </p>
          
          {rank && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Trophy className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                Rank #{rank.rank.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                (Top {rank.percentile.toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Social Action Buttons */}
          {user && !isOwnProfile && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {/* Friend Request Button */}
              {relationshipStatus === 'none' && (
                <Button
                  size="sm"
                  onClick={handleSendFriendRequest}
                  disabled={actionLoading === 'friend'}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Friend
                </Button>
              )}
              
              {relationshipStatus === 'pending_sent' && (
                <Button size="sm" variant="secondary" disabled className="gap-2">
                  <Clock className="h-4 w-4" />
                  Request Sent
                </Button>
              )}
              
              {relationshipStatus === 'pending_received' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/notifications')}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Respond to Request
                </Button>
              )}
              
              {relationshipStatus === 'friends' && (
                <Button size="sm" variant="outline" disabled className="gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Friends
                </Button>
              )}
              
              {/* Challenge to Battle Button */}
              <Button
                size="sm"
                variant="destructive"
                onClick={handleChallengeToBattle}
                className="gap-2"
              >
                <Swords className="h-4 w-4" />
                Challenge
              </Button>
              
              {/* Send Message Button (only if friends) */}
              {relationshipStatus === 'friends' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendMessage}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              )}
            </div>
          )}

          {/* View Own Profile Button */}
          {isOwnProfile && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/profile')}
                className="gap-2"
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Grid */}
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
                <span className="text-sm font-bold mt-1">
                  {profile.total_points >= 1000 
                    ? `${(profile.total_points / 1000).toFixed(1)}k` 
                    : profile.total_points}
                </span>
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
                <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
                <span className="text-sm font-bold mt-1">{profile.current_streak}</span>
                <span className="text-[10px] text-muted-foreground">Streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Badges */}
      <section className="px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏅</span>
              <h3 className="font-semibold">Featured Badges</h3>
            </div>
            
            {showcaseBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {showcaseBadges.map((badge, index) => (
                  <div
                    key={badge.id || index}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center p-2",
                      "bg-gradient-to-br from-card to-accent/50"
                    )}
                    style={{
                      boxShadow: `0 0 15px ${RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF'}30`
                    }}
                  >
                    <span className="text-3xl mb-1">{badge.icon || '🏆'}</span>
                    <span className="text-[10px] font-medium text-center line-clamp-1">
                      {badge.name}
                    </span>
                    <span 
                      className="text-[8px] font-bold uppercase mt-0.5"
                      style={{ color: RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF' }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                ))}
                {/* Empty slots */}
                {[...Array(Math.max(0, 3 - showcaseBadges.length))].map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/20"
                  >
                    <span className="text-xs text-muted-foreground">Empty</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl mb-2 block">🏆</span>
                <p className="text-sm text-muted-foreground">No badges earned yet</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
            </p>
          </div>
        </div>
      </section>

      {/* More Stats */}
      <section className="px-4 py-3 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Statistics
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Longest Streak</span>
                <span className="font-medium">{profile.longest_streak} days 🔥</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Points</span>
                <span className="font-medium">{profile.total_points.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Quizzes Completed</span>
                <span className="font-medium">{profile.total_quizzes_completed}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Average Accuracy</span>
                <span className="font-medium">{Math.round(profile.accuracy)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
