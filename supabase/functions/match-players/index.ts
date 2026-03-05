import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion'];

function tierDistance(a: string | null, b: string | null): number {
  const ai = TIER_ORDER.indexOf((a || 'bronze').toLowerCase());
  const bi = TIER_ORDER.indexOf((b || 'bronze').toLowerCase());
  return Math.abs((ai === -1 ? 0 : ai) - (bi === -1 ? 0 : bi));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seedBattleQuestions(
  admin: ReturnType<typeof createClient>,
  battleId: string,
  subjectId: number | null,
  count = 10,
) {
  let query = admin.from('questions').select('id');
  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  let { data: subjectQuestions } = await query.limit(count * 3);
  if (!subjectQuestions || subjectQuestions.length === 0) {
    const fallback = await admin.from('questions').select('id').limit(count * 3);
    subjectQuestions = fallback.data || [];
  }

  const selected = shuffle(subjectQuestions || []).slice(0, count);
  if (!selected.length) return;

  await admin.from('battle_questions').insert(
    selected.map((q, index) => ({
      battle_id: battleId,
      question_id: q.id,
      order_index: index,
    })),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ matched: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const expiredCutoff = new Date(Date.now() - 30000).toISOString();
    await admin
      .from('matchmaking_queue')
      .update({ status: 'expired' })
      .eq('status', 'searching')
      .lt('created_at', expiredCutoff);

    const { data: ownEntry } = await admin
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'searching')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ownEntry) {
      return new Response(JSON.stringify({ matched: false, reason: 'not_searching' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queueAgeMs = Date.now() - new Date(ownEntry.created_at).getTime();
    const expandedSearch = queueAgeMs >= 10000;

    let candidateQuery = admin
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .eq('match_type', ownEntry.match_type)
      .neq('user_id', ownEntry.user_id)
      .order('created_at', { ascending: true })
      .limit(25);

    if (ownEntry.match_type === 'casual' && ownEntry.subject_id) {
      candidateQuery = candidateQuery.eq('subject_id', ownEntry.subject_id);
    }

    const { data: allCandidates } = await candidateQuery;
    if (!allCandidates?.length) {
      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const candidates = ownEntry.match_type === 'ranked'
      ? allCandidates.filter((c: any) => tierDistance(c.tier, ownEntry.tier) <= (expandedSearch ? 3 : 1))
      : allCandidates;

    if (!candidates.length) {
      return new Response(JSON.stringify({ matched: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const candidate of candidates as any[]) {
      if (ownEntry.match_type === 'ranked') {
        const antiFarmCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: recentPairings } = await admin
          .from('battle_rank_changes')
          .select('id')
          .eq('user_id', ownEntry.user_id)
          .eq('opponent_id', candidate.user_id)
          .gte('created_at', antiFarmCutoff)
          .limit(1);

        if (recentPairings && recentPairings.length > 0) {
          continue;
        }
      }

      const { data: claimedCandidate } = await admin
        .from('matchmaking_queue')
        .update({ status: 'matching' })
        .eq('id', candidate.id)
        .eq('status', 'searching')
        .select('id, user_id')
        .maybeSingle();

      if (!claimedCandidate) continue;

      const { data: claimedSelf } = await admin
        .from('matchmaking_queue')
        .update({ status: 'matching' })
        .eq('id', ownEntry.id)
        .eq('status', 'searching')
        .select('id')
        .maybeSingle();

      if (!claimedSelf) {
        await admin
          .from('matchmaking_queue')
          .update({ status: 'searching' })
          .eq('id', candidate.id)
          .eq('status', 'matching');
        continue;
      }

      const { data: battle, error: battleError } = await admin
        .from('battles')
        .insert({
          subject_id: ownEntry.subject_id,
          status: 'active',
          is_private: false,
          created_by: ownEntry.user_id,
          started_at: new Date().toISOString(),
          mode: '1v1',
          room_code: null,
          match_type: ownEntry.match_type,
        })
        .select('id')
        .single();

      if (battleError || !battle) {
        await admin
          .from('matchmaking_queue')
          .update({ status: 'searching', matched_with: null, battle_id: null })
          .in('id', [ownEntry.id, candidate.id]);
        continue;
      }

      const { error: participantError } = await admin.from('battle_participants').insert([
        {
          battle_id: battle.id,
          user_id: ownEntry.user_id,
          ready: true,
          score: 0,
          answers_correct: 0,
          status: 'joined',
        },
        {
          battle_id: battle.id,
          user_id: candidate.user_id,
          ready: true,
          score: 0,
          answers_correct: 0,
          status: 'joined',
        },
      ]);

      if (participantError) {
        await admin.from('battles').update({ status: 'cancelled' }).eq('id', battle.id);
        await admin
          .from('matchmaking_queue')
          .update({ status: 'searching', matched_with: null, battle_id: null })
          .in('id', [ownEntry.id, candidate.id]);
        continue;
      }

      await seedBattleQuestions(admin, battle.id, ownEntry.subject_id, 10);

      await admin
        .from('matchmaking_queue')
        .update({
          status: 'matched',
          matched_with: candidate.user_id,
          battle_id: battle.id,
        })
        .eq('id', ownEntry.id);

      await admin
        .from('matchmaking_queue')
        .update({
          status: 'matched',
          matched_with: ownEntry.user_id,
          battle_id: battle.id,
        })
        .eq('id', candidate.id);

      return new Response(
        JSON.stringify({ matched: true, battleId: battle.id, opponentId: candidate.user_id }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    await admin
      .from('matchmaking_queue')
      .update({ status: 'searching' })
      .eq('id', ownEntry.id)
      .eq('status', 'matching');

    return new Response(JSON.stringify({ matched: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
