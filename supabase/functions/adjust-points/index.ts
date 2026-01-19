import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate tier based on points - matches UI thresholds
function calculateTier(points: number): string {
  if (points >= 50000) return "champion";
  if (points >= 30000) return "diamond";
  if (points >= 15000) return "platinum";
  if (points >= 7500) return "gold";
  if (points >= 3000) return "silver";
  return "bronze";
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

    const { user_id, points_change, is_adding, reason } = await req.json();
    
    if (!user_id || points_change === undefined) {
      return json({ error: "Missing user_id or points_change" }, 400);
    }

    const changeAmount = parseInt(points_change);
    if (isNaN(changeAmount) || changeAmount < 0) {
      return json({ error: "points_change must be a positive number" }, 400);
    }

    // 1) Identify caller via JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("adjust-points: auth.getUser failed", userError);
      return json({ error: "Unauthenticated" }, 401);
    }

    const callerId = userData.user.id;
    console.log("adjust-points: caller =", callerId, "target =", user_id, "change =", is_adding ? `+${changeAmount}` : `-${changeAmount}`);

    // 2) Use service role for admin check + updates (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", callerId)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin" || callerProfile?.is_admin === true;

    if (!isAdmin) {
      return json({ error: "Forbidden (admin only)" }, 403);
    }

    // 3) Get target user's current points
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, total_points, weekly_points, tier")
      .eq("id", user_id)
      .single();

    if (targetError || !targetProfile) {
      console.error("adjust-points: target user not found", targetError);
      return json({ error: "User not found" }, 404);
    }

    const currentPoints = targetProfile.total_points || 0;
    const currentWeeklyPoints = targetProfile.weekly_points || 0;
    
    // Calculate new points
    const newTotalPoints = is_adding 
      ? currentPoints + changeAmount 
      : Math.max(0, currentPoints - changeAmount);
    
    const newWeeklyPoints = is_adding 
      ? currentWeeklyPoints + changeAmount 
      : Math.max(0, currentWeeklyPoints - changeAmount);
    
    const newTier = calculateTier(newTotalPoints);

    // 4) Update profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ 
        total_points: newTotalPoints,
        weekly_points: newWeeklyPoints,
        tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("adjust-points: update failed", updateError);
      return json({ error: "Failed to update points" }, 500);
    }

    // 5) Audit log
    await supabaseAdmin.from("admin_actions").insert([{
      admin_id: callerId,
      action_type: "edit_points",
      target_user_id: user_id,
      details: {
        previous_points: currentPoints,
        new_points: newTotalPoints,
        change: is_adding ? `+${changeAmount}` : `-${changeAmount}`,
        reason: reason || "No reason provided",
      },
    }]);

    console.log(`adjust-points: ${targetProfile.username} points: ${currentPoints} -> ${newTotalPoints} (${newTier})`);

    return json({ 
      success: true, 
      message: `Points ${is_adding ? 'added' : 'removed'} successfully`,
      username: targetProfile.username,
      previous_points: currentPoints,
      new_points: newTotalPoints,
      tier: newTier,
    }, 200);

  } catch (e) {
    console.error("adjust-points: unexpected error", e);
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
