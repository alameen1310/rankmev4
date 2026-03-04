import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find pairs of searching players with compatible criteria
    const { data: searching, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .order('created_at', { ascending: true });

    if (error || !searching || searching.length < 2) {
      return new Response(JSON.stringify({ matched: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let matched = 0;
    const used = new Set<string>();

    for (let i = 0; i < searching.length; i++) {
      if (used.has(searching[i].id)) continue;

      for (let j = i + 1; j < searching.length; j++) {
        if (used.has(searching[j].id)) continue;

        const a = searching[i];
        const b = searching[j];

        // Must be same match_type
        if (a.match_type !== b.match_type) continue;

        // For casual, must be same subject
        if (a.match_type === 'casual' && a.subject_id !== b.subject_id) continue;

        // Match found - update both entries
        await supabase
          .from('matchmaking_queue')
          .update({ status: 'matched', matched_with: b.user_id })
          .eq('id', a.id);

        await supabase
          .from('matchmaking_queue')
          .update({ status: 'matched', matched_with: a.user_id })
          .eq('id', b.id);

        used.add(a.id);
        used.add(b.id);
        matched++;
        break;
      }
    }

    // Expire entries older than 60 seconds
    const cutoff = new Date(Date.now() - 60000).toISOString();
    await supabase
      .from('matchmaking_queue')
      .update({ status: 'expired' })
      .eq('status', 'searching')
      .lt('created_at', cutoff);

    return new Response(JSON.stringify({ matched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
