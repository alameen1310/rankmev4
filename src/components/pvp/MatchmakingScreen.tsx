import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { joinQueue, leaveQueue, findMatch, subscribeToQueue, type QueueEntry } from '@/services/matchmaking';
import { supabase } from '@/integrations/supabase/client';
import { soundEngine } from '@/lib/sounds';
import { Button } from '@/components/ui/button';
import { Loader2, X, Swords, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchmakingScreenProps {
  matchType: 'casual' | 'ranked';
  subjectId: number | null;
  subjectName?: string;
  onCancel: () => void;
}

export function MatchmakingScreen({ matchType, subjectId, subjectName, onCancel }: MatchmakingScreenProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<'searching' | 'found' | 'timeout' | 'error'>('searching');
  const [expandSearch, setExpandSearch] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !profile) return;

    let cancelled = false;

    const start = async () => {
      try {
        await joinQueue(user.id, matchType, subjectId, profile.tier || 'bronze');
      } catch {
        setStatus('error');
        return;
      }

      // Subscribe to realtime updates on our queue entry
      const channel = subscribeToQueue(user.id, (entry: QueueEntry) => {
        if (entry.status === 'matched' && entry.battle_id) {
          setStatus('found');
          soundEngine.playMatchFound();
          setTimeout(() => {
            if (!cancelled) navigate(`/battle/${entry.battle_id}`);
          }, 1500);
        }
      });

      // Poll for matches every 3 seconds
      pollRef.current = setInterval(async () => {
        if (cancelled || status !== 'searching') return;
        const result = await findMatch(user.id, matchType, subjectId, profile.tier || 'bronze', expandSearch);
        if (result.matched && result.battleId) {
          setStatus('found');
          soundEngine.playMatchFound();
          setTimeout(() => {
            if (!cancelled) navigate(`/battle/${result.battleId}`);
          }, 1500);
        }
      }, 3000);

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= 10 && !expandSearch) setExpandSearch(true);
          if (next >= 30) {
            setStatus('timeout');
            return next;
          }
          return next;
        });
      }, 1000);

      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    };

    start();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      leaveQueue(user.id);
    };
  }, [user, profile]);

  const handleCancel = async () => {
    if (user) await leaveQueue(user.id);
    onCancel();
  };

  const handleRetry = async () => {
    setStatus('searching');
    setElapsed(0);
    setExpandSearch(false);
    if (user && profile) {
      await joinQueue(user.id, matchType, subjectId, profile.tier || 'bronze');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-6 px-6 max-w-sm w-full">
        {status === 'searching' && (
          <>
            {/* Animated search ring */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-3 rounded-full border-4 border-primary/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-1">Searching for opponent...</h2>
              <p className="text-sm text-muted-foreground">
                {matchType === 'ranked' ? 'Ranked Match' : 'Casual Match'}
                {subjectName && ` • ${subjectName}`}
              </p>
            </div>

            <div className="text-2xl font-mono font-bold text-primary">
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
            </div>

            {expandSearch && (
              <p className="text-xs text-muted-foreground animate-fade-in">
                Expanding search range...
              </p>
            )}

            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="w-4 h-4" /> Cancel Search
            </Button>
          </>
        )}

        {status === 'found' && (
          <>
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="w-14 h-14 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-primary animate-pulse">
              Opponent Found!
            </h2>
            <p className="text-muted-foreground">Starting battle...</p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">No opponent found</h2>
            <p className="text-sm text-muted-foreground">
              Try again or create a private match instead.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry}>Try Again</Button>
              <Button variant="outline" onClick={handleCancel}>Back</Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-destructive">Error</h2>
            <p className="text-sm text-muted-foreground">Failed to join queue. Please try again.</p>
            <Button variant="outline" onClick={handleCancel}>Back</Button>
          </>
        )}
      </div>
    </div>
  );
}
