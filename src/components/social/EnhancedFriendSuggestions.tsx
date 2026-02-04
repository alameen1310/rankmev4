import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, X, Swords, RefreshCw, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendSuggestions, dismissSuggestion, getFilteredSuggestions, SuggestedUser } from '@/services/suggestions';
import { sendFriendRequest } from '@/services/friends';
import { toast } from 'sonner';
import type { Tier } from '@/types';
import { cn } from '@/lib/utils';

interface EnhancedFriendSuggestionsProps {
  maxItems?: number;
  onChallenge?: (userId: string) => void;
}

export function EnhancedFriendSuggestions({ maxItems = 10, onChallenge }: EnhancedFriendSuggestionsProps) {
  const { profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const loadSuggestions = async (isRefresh = false) => {
    if (!isAuthenticated || !profile) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getFriendSuggestions();
      const filtered = getFilteredSuggestions(data);
      setSuggestions(filtered.slice(0, maxItems));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [isAuthenticated, profile, maxItems]);

  const handleAddFriend = async (user: SuggestedUser) => {
    if (!profile) return;

    setSendingRequest(user.id);
    try {
      await sendFriendRequest(profile.id, user.id);
      toast.success(`Friend request sent to ${user.username || 'user'}!`);
      setSentRequests(prev => new Set([...prev, user.id]));
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Friend request already sent');
        setSentRequests(prev => new Set([...prev, user.id]));
      } else {
        toast.error('Failed to send friend request');
      }
    } finally {
      setSendingRequest(null);
    }
  };

  const handleChallenge = (userId: string) => {
    if (onChallenge) {
      onChallenge(userId);
    } else {
      // Navigate to PvP lobby with the user as target
      navigate(`/pvp-lobby?challenge=${userId}`);
    }
  };

  const handleDismiss = async (userId: string) => {
    await dismissSuggestion(userId);
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  const handleRefresh = () => {
    loadSuggestions(true);
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">No suggestions available</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="mt-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Players You May Want to Challenge</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="space-y-2">
        {suggestions.map(user => {
          const hasSentRequest = sentRequests.has(user.id);
          
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Link to={`/user/${user.id}`}>
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(user.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link 
                    to={`/user/${user.id}`} 
                    className="font-medium text-sm truncate hover:underline"
                  >
                    {user.username || 'User'}
                  </Link>
                  {user.tier && <TierBadge tier={user.tier as Tier} size="sm" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    {user.matchReason}
                  </p>
                  {user.equipped_title && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {user.equipped_title}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleChallenge(user.id)}
                  className="h-8 px-3"
                >
                  <Swords className="h-3.5 w-3.5 mr-1" />
                  Challenge
                </Button>
                
                {hasSentRequest ? (
                  <Badge variant="secondary" className="h-8 px-2 text-xs">
                    Sent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddFriend(user)}
                    disabled={sendingRequest === user.id}
                    className="h-8 px-2"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                )}
                
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
          );
        })}
      </div>
    </div>
  );
}
