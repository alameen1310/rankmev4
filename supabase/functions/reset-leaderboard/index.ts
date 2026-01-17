import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResetResponse = {
  success: boolean;
  profiles_reset: number;
  leaderboard_entries_reset: number;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return json(
        { error: "Missing Authorization header" },
        401,
      );
    }

    // 1) Identify caller via JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("reset-leaderboard: auth.getUser failed", userError);
      return json({ error: "Unauthenticated" }, 401);
    }

    const callerId = userData.user.id;

    // 2) Use service role for admin check + bulk updates (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", callerId)
      .maybeSingle();

    if (profileError) {
      console.error("reset-leaderboard: failed to load caller profile", profileError);
      return json({ error: "Failed to verify admin" }, 500);
    }

    if (!profile?.is_admin) {
      return json({ error: "Forbidden (admin only)" }, 403);
    }

    console.log(`reset-leaderboard: admin ${callerId} requested reset`);

    // 3) Reset all profiles points
    // NOTE: The Deno type definitions for the ESM build sometimes omit the `select(columns, options)` overload,
    // so we cast to `any` here to use count/head safely.
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
      console.error("reset-leaderboard: profiles update failed", profilesError);
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
      console.error("reset-leaderboard: leaderboard_entries update failed", leaderboardError);
      return json({ error: "Failed to reset leaderboard entries" }, 500);
    }

    // 5) Audit log
    const auditDetails = {
      profiles_reset: profilesCount ?? null,
      leaderboard_entries_reset: leaderboardCount ?? null,
      reset_date: new Date().toISOString(),
    };

    const { error: auditError } = await supabaseAdmin
      .from("admin_actions")
      .insert([
        {
          admin_id: callerId,
          action_type: "reset_leaderboard",
          target_user_id: null,
          details: auditDetails,
        },
      ]);

    if (auditError) {
      // Non-fatal
      console.warn("reset-leaderboard: failed to write admin_actions", auditError);
    }

    const response: ResetResponse = {
      success: true,
      profiles_reset: profilesCount ?? 0,
      leaderboard_entries_reset: leaderboardCount ?? 0,
    };

    console.log(
      `reset-leaderboard: done profiles=${response.profiles_reset} leaderboard_entries=${response.leaderboard_entries_reset}`,
    );

    return json(response, 200);
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
