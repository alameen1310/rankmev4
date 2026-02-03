import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, X, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendSuggestions, dismissSuggestion, getFilteredSuggestions, SuggestedUser } from '@/services/suggestions';
import { sendFriendRequest } from '@/services/friends';
import { toast } from 'sonner';
import type { Tier } from '@/types';

interface FriendSuggestionsProps {
  compact?: boolean;
  maxItems?: number;
}

export function FriendSuggestions({ compact = false, maxItems = 5 }: FriendSuggestionsProps) {
  const { profile, isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      setLoading(false);
      return;
    }

    const loadSuggestions = async () => {
      try {
        const data = await getFriendSuggestions();
        const filtered = getFilteredSuggestions(data);
        setSuggestions(filtered.slice(0, maxItems));
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [isAuthenticated, profile, maxItems]);

  const handleAddFriend = async (user: SuggestedUser) => {
    if (!profile) return;

    setSendingRequest(user.id);
    try {
      await sendFriendRequest(profile.id, user.id);
      toast.success(`Friend request sent to ${user.username || 'user'}!`);
      setSuggestions(prev => prev.filter(s => s.id !== user.id));
    } catch (error: any) {
      // Check for duplicate request
      if (error.code === '23505') {
        toast.error('Friend request already sent');
      } else {
        toast.error('Failed to send friend request');
      }
    } finally {
      setSendingRequest(null);
    }
  };

  const handleDismiss = async (userId: string) => {
    await dismissSuggestion(userId);
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Players to Challenge</h3>
          </div>
          <Link to="/friends" className="text-xs text-primary flex items-center">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {suggestions.slice(0, 4).map(user => (
            <div key={user.id} className="flex flex-col items-center min-w-[80px]">
              <Link to={`/user/${user.id}`}>
                <Avatar className="h-12 w-12 border-2 border-primary/20 mb-1">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(user.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <span className="text-xs font-medium truncate w-full text-center">
                {user.username || 'User'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAddFriend(user)}
                disabled={sendingRequest === user.id}
                className="h-6 text-xs mt-1 px-2"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Players You May Want to Challenge</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Link to={`/user/${user.id}`}>
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(user.username || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link to={`/user/${user.id}`} className="font-medium text-sm truncate hover:underline">
                  {user.username || 'User'}
                </Link>
                {user.tier && <TierBadge tier={user.tier as Tier} size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.matchReason}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                onClick={() => handleAddFriend(user)}
                disabled={sendingRequest === user.id}
                className="h-8"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(user.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 3 && (
        <Link to="/friends" className="block mt-3">
          <Button variant="ghost" className="w-full text-sm">
            View more suggestions
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}
