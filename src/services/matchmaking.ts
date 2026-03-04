import { supabase } from '@/integrations/supabase/client';
import { createBattle, joinBattle } from './battles';
import type { Subject } from '@/types';

export interface QueueEntry {
  id: string;
  user_id: string;
  match_type: 'casual' | 'ranked';
  subject_id: number | null;
  tier: string | null;
  status: 'searching' | 'matched' | 'cancelled' | 'expired';
  matched_with: string | null;
  battle_id: string | null;
  created_at: string;
}

// Tier proximity for matching
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'];

function tierDistance(a: string | null, b: string | null): number {
  const ai = TIER_ORDER.indexOf(a || 'bronze');
  const bi = TIER_ORDER.indexOf(b || 'bronze');
  return Math.abs(ai - bi);
}

// Join matchmaking queue
export async function joinQueue(
  userId: string,
  matchType: 'casual' | 'ranked',
  subjectId: number | null,
  tier: string | null
): Promise<QueueEntry> {
  // First cancel any existing searching entries
  await supabase
    .from('matchmaking_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'searching');

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
    .eq('status', 'searching');

  if (error) {
    console.error('[Matchmaking] Error leaving queue:', error);
  }
}

// Poll for a match (called periodically by the searching player)
export async function findMatch(
  userId: string,
  matchType: 'casual' | 'ranked',
  subjectId: number | null,
  tier: string | null,
  expandedSearch: boolean = false
): Promise<{ matched: boolean; battleId?: string; opponentId?: string }> {
  // Find other searching players with compatible criteria
  let query = supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('status', 'searching')
    .eq('match_type', matchType)
    .neq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(10);

  // For casual, match same subject
  if (matchType === 'casual' && subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data: candidates, error } = await query;

  if (error || !candidates || candidates.length === 0) {
    return { matched: false };
  }

  // Filter by tier proximity
  let bestMatch = candidates[0];
  if (matchType === 'ranked' && !expandedSearch) {
    // Prefer same tier, then ±1
    const sorted = candidates.sort((a: any, b: any) => 
      tierDistance(a.tier, tier) - tierDistance(b.tier, tier)
    );
    const close = sorted.filter((c: any) => tierDistance(c.tier, tier) <= (expandedSearch ? 3 : 1));
    if (close.length > 0) {
      bestMatch = close[0];
    } else if (!expandedSearch) {
      return { matched: false };
    }
  }

  const opponent = bestMatch as QueueEntry;

  try {
    // Determine subject slug for battle creation
    const subjectSlugMap: Record<number, Subject> = {};
    const { data: subjects } = await supabase.from('subjects').select('id, slug');
    if (subjects) {
      subjects.forEach((s: any) => { subjectSlugMap[s.id] = s.slug as Subject; });
    }

    const battleSubject = subjectId ? (subjectSlugMap[subjectId] || 'mathematics') : 'mathematics';

    // Create the battle
    const battle = await createBattle(userId, battleSubject, false);

    // Join opponent
    await joinBattle(battle.id, opponent.user_id);

    // Update both queue entries
    await supabase
      .from('matchmaking_queue')
      .update({ 
        status: 'matched', 
        matched_with: opponent.user_id, 
        battle_id: battle.id 
      })
      .eq('user_id', userId)
      .eq('status', 'searching');

    // We can't update opponent's entry due to RLS (they own it)
    // Instead, the opponent will detect the match via realtime subscription

    return { matched: true, battleId: battle.id, opponentId: opponent.user_id };
  } catch (err) {
    console.error('[Matchmaking] Error creating match:', err);
    return { matched: false };
  }
}

// Subscribe to queue changes for the current user
export function subscribeToQueue(
  userId: string,
  onUpdate: (entry: QueueEntry) => void
) {
  const channel = supabase
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

  return channel;
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
