import { supabase } from '@/integrations/supabase/client';

export interface QueueEntry {
  id: string;
  user_id: string;
  match_type: 'casual' | 'ranked';
  subject_id: number | null;
  tier: string | null;
  status: 'searching' | 'matching' | 'matched' | 'cancelled' | 'expired';
  matched_with: string | null;
  battle_id: string | null;
  created_at: string;
}

// Join matchmaking queue
export async function joinQueue(
  userId: string,
  matchType: 'casual' | 'ranked',
  subjectId: number | null,
  tier: string | null
): Promise<QueueEntry> {
  await supabase
    .from('matchmaking_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .in('status', ['searching', 'matching']);

  const { data, error } = await supabase
    .from('matchmaking_queue')
    .insert({
      user_id: userId,
      match_type: matchType,
      subject_id: subjectId,
      tier,
      status: 'searching',
    })
    .select()
    .single();

  if (error) {
    console.error('[Matchmaking] Error joining queue:', error);
    throw error;
  }

  return data as QueueEntry;
}

// Leave matchmaking queue
export async function leaveQueue(userId: string): Promise<void> {
  const { error } = await supabase
    .from('matchmaking_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .in('status', ['searching', 'matching']);

  if (error) {
    console.error('[Matchmaking] Error leaving queue:', error);
  }
}

// Poll for a match via backend matcher
export async function findMatch(
  _userId: string,
  _matchType: 'casual' | 'ranked',
  _subjectId: number | null,
  _tier: string | null,
  expandedSearch: boolean = false
): Promise<{ matched: boolean; battleId?: string; opponentId?: string }> {
  const { data, error } = await supabase.functions.invoke('match-players', {
    body: { expandedSearch },
  });

  if (error) {
    console.error('[Matchmaking] match-players invoke error:', error);
    return { matched: false };
  }

  const payload = (data || {}) as {
    matched?: boolean;
    battleId?: string;
    opponentId?: string;
  };

  if (payload.matched && payload.battleId) {
    return {
      matched: true,
      battleId: payload.battleId,
      opponentId: payload.opponentId,
    };
  }

  return { matched: false };
}

// Subscribe to queue changes for the current user
export function subscribeToQueue(
  userId: string,
  onUpdate: (entry: QueueEntry) => void
) {
  return supabase
    .channel(`matchmaking:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matchmaking_queue',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as QueueEntry);
        }
      }
    )
    .subscribe();
}

// Check if user is already in an active match
export async function isInActiveMatch(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('battle_participants')
    .select('battle_id, battles!inner(status)')
    .eq('user_id', userId)
    .in('battles.status', ['waiting', 'active'])
    .limit(1);

  if (data && data.length > 0) {
    return (data[0] as any).battle_id;
  }

  return null;
}
