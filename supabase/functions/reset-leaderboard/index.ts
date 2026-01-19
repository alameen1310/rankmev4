import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetResponse {
  success: boolean;
  profiles_reset: number;
  leaderboard_reset: number;
  is_scheduled?: boolean;
  message?: string;
}

interface AffectedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  total_points: number | null;
  weekly_points: number | null;
  tier: string | null;
  avatar_url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // Parse request body for optional preview mode
    let body: { preview?: boolean; scheduled?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 1) Identify caller via JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("reset-leaderboard: auth.getUser failed", userError);
      return json({ error: "Unauthenticated" }, 401);
    }

    const callerId = userData.user.id;
    console.log("reset-leaderboard: caller id =", callerId, "preview =", body.preview);

    // 2) Use service role for admin check + resets (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role using user_roles table
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    // Fallback to profiles.is_admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", callerId)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin" || profile?.is_admin === true;

    if (!isAdmin) {
      console.log("reset-leaderboard: caller is not admin");
      return json({ error: "Forbidden (admin only)" }, 403);
    }

    // Preview mode - return affected users without resetting
    if (body.preview) {
      const { data: affectedUsers, error: previewError } = await supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, total_points, weekly_points, tier, avatar_url")
        .gt("total_points", 0)
        .order("total_points", { ascending: false });

      if (previewError) {
        console.error("reset-leaderboard: preview query failed", previewError);
        return json({ error: "Failed to fetch preview data" }, 500);
      }

      return json({
        success: true,
        preview: true,
        affected_users: affectedUsers || [],
        total_affected: affectedUsers?.length || 0,
      }, 200);
    }

    console.log("reset-leaderboard: starting reset...");

    // 3) Reset all profiles points and tier
    const { error: profilesError, count: profilesCount } = await (supabaseAdmin
      .from("profiles") as any)
      .update({ 
        total_points: 0, 
        weekly_points: 0, 
        tier: "bronze",
        updated_at: new Date().toISOString(),
      })
      .not("id", "is", null)
      .select("id", { count: "exact", head: true });

    if (profilesError) {
      console.error("reset-leaderboard: profiles reset failed", profilesError);
      return json({ error: "Failed to reset profiles" }, 500);
    }

    // 4) Reset leaderboard entries
    const { error: leaderboardError, count: leaderboardCount } = await (supabaseAdmin
      .from("leaderboard_entries") as any)
      .update({ 
        points: 0, 
        rank: null,
        updated_at: new Date().toISOString(),
      })
      .not("id", "is", null)
      .select("id", { count: "exact", head: true });

    if (leaderboardError) {
      console.error("reset-leaderboard: leaderboard reset failed", leaderboardError);
    }

    // 5) Log the reset action
    await supabaseAdmin.from("admin_actions").insert([{
      admin_id: callerId,
      action_type: body.scheduled ? "scheduled_leaderboard_reset" : "leaderboard_reset",
      target_user_id: null,
      details: {
        profiles_reset: profilesCount || 0,
        leaderboard_reset: leaderboardCount || 0,
        reset_at: new Date().toISOString(),
        is_scheduled: body.scheduled || false,
      },
    }]);

    console.log(`reset-leaderboard: reset ${profilesCount} profiles, ${leaderboardCount} leaderboard entries`);

    const response: ResetResponse = {
      success: true,
      profiles_reset: profilesCount || 0,
      leaderboard_reset: leaderboardCount || 0,
      is_scheduled: body.scheduled || false,
      message: `Successfully reset ${profilesCount || 0} users to 0 points`,
    };

    return json(response as unknown as Record<string, unknown>, 200);

  } catch (e) {
    console.error("reset-leaderboard: unexpected error", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
