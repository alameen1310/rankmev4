import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get';

    if (action === 'dismiss') {
      // Handle dismissing a suggestion
      const { userId } = await req.json();
      
      // Store dismissed suggestion in local tracking (we'll use a simple approach)
      // In production, you'd store this in a dismissed_suggestions table
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user's profile
    const { data: currentProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, country, tier, total_points, last_active_date')
      .eq('id', user.id)
      .single();

    if (profileError || !currentProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's existing friends
    const { data: friendships } = await supabaseClient
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);

    const friendIds = (friendships || []).map(f => f.friend_id);

    // Get pending friend requests (both sent and received)
    const { data: pendingRequests } = await supabaseClient
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq('status', 'pending');

    const pendingUserIds = (pendingRequests || []).flatMap(r => [r.from_user_id, r.to_user_id]);

    // Exclude self, friends, and pending requests
    const excludeIds = [user.id, ...friendIds, ...pendingUserIds];

    // Calculate user's rank range for matching
    const minPoints = Math.max(0, (currentProfile.total_points || 0) - 500);
    const maxPoints = (currentProfile.total_points || 0) + 500;

    // Build suggestion query with scoring
    let query = supabaseClient
      .from('profiles')
      .select('id, username, display_name, avatar_url, country, tier, total_points, equipped_title, showcase_badges, last_active_date')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .not('username', 'is', null)
      .order('last_active_date', { ascending: false, nullsFirst: false })
      .limit(50);

    const { data: candidates, error: candidatesError } = await query;

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch suggestions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score and rank candidates
    const scoredCandidates = (candidates || []).map(candidate => {
      let score = 0;

      // Same country = +30 points
      if (candidate.country && candidate.country === currentProfile.country) {
        score += 30;
      }

      // Similar rank/points = +25 points
      const pointsDiff = Math.abs((candidate.total_points || 0) - (currentProfile.total_points || 0));
      if (pointsDiff <= 200) {
        score += 25;
      } else if (pointsDiff <= 500) {
        score += 15;
      } else if (pointsDiff <= 1000) {
        score += 5;
      }

      // Same tier = +20 points
      if (candidate.tier === currentProfile.tier) {
        score += 20;
      }

      // Recent activity = +15 points (active in last 7 days)
      if (candidate.last_active_date) {
        const lastActive = new Date(candidate.last_active_date);
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 1) {
          score += 15;
        } else if (daysSinceActive <= 3) {
          score += 10;
        } else if (daysSinceActive <= 7) {
          score += 5;
        }
      }

      // Has profile picture = +5 points
      if (candidate.avatar_url) {
        score += 5;
      }

      // Has equipped title = +5 points (more engaged user)
      if (candidate.equipped_title) {
        score += 5;
      }

      return { ...candidate, matchScore: score };
    });

    // Sort by score and take top 10
    const suggestions = scoredCandidates
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)
      .map(({ matchScore, ...profile }) => ({
        ...profile,
        matchReason: getMatchReason(profile, currentProfile),
      }));

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Friend suggestions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMatchReason(candidate: any, currentProfile: any): string {
  if (candidate.country && candidate.country === currentProfile.country) {
    return `From ${candidate.country}`;
  }
  if (candidate.tier === currentProfile.tier) {
    return `Same tier as you`;
  }
  const pointsDiff = Math.abs((candidate.total_points || 0) - (currentProfile.total_points || 0));
  if (pointsDiff <= 200) {
    return `Similar rank`;
  }
  return `Active player`;
}
