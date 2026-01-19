import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { user_id, confirm_username } = await req.json();
    if (!user_id) {
      return json({ error: "Missing user_id" }, 400);
    }

    // 1) Identify caller via JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("delete-user: auth.getUser failed", userError);
      return json({ error: "Unauthenticated" }, 401);
    }

    const callerId = userData.user.id;
    console.log("delete-user: caller id =", callerId, "target =", user_id);

    // 2) Use service role for admin check + deletions (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role using has_role function or direct table lookup
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", callerId)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin" || profile?.is_admin === true;

    if (!isAdmin) {
      return json({ error: "Forbidden (admin only)" }, 403);
    }

    // Prevent self-deletion
    if (callerId === user_id) {
      return json({ error: "Cannot delete your own account" }, 400);
    }

    // 3) Get target user's profile for confirmation
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", user_id)
      .single();

    if (targetError || !targetProfile) {
      console.error("delete-user: target user not found", targetError);
      return json({ error: "User not found" }, 404);
    }

    if (confirm_username && targetProfile.username !== confirm_username) {
      return json({ error: "Username confirmation does not match" }, 400);
    }

    console.log(`delete-user: admin ${callerId} deleting user ${user_id} (${targetProfile.username})`);

    // 4) CRITICAL: Nullify foreign key references first
    // battles.winner_id -> set to null
    await supabaseAdmin.from("battles").update({ winner_id: null }).eq("winner_id", user_id);
    // battles.created_by -> set to null
    await supabaseAdmin.from("battles").update({ created_by: null }).eq("created_by", user_id);
    // admin_actions.target_user_id -> set to null
    await supabaseAdmin.from("admin_actions").update({ target_user_id: null }).eq("target_user_id", user_id);
    // admin_actions.admin_id -> needs special handling (can't nullify, so delete those entries)
    await supabaseAdmin.from("admin_actions").delete().eq("admin_id", user_id);

    // 5) Delete related data (order matters due to foreign keys)
    await supabaseAdmin.from("battle_answers").delete().eq("user_id", user_id);
    await supabaseAdmin.from("battle_participants").delete().eq("user_id", user_id);
    await supabaseAdmin.from("message_reactions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("direct_messages").delete().eq("sender_id", user_id);
    await supabaseAdmin.from("direct_messages").delete().eq("receiver_id", user_id);
    await supabaseAdmin.from("friend_requests").delete().eq("from_user_id", user_id);
    await supabaseAdmin.from("friend_requests").delete().eq("to_user_id", user_id);
    await supabaseAdmin.from("friendships").delete().eq("user_id", user_id);
    await supabaseAdmin.from("friendships").delete().eq("friend_id", user_id);
    await supabaseAdmin.from("notifications").delete().eq("user_id", user_id);
    
    // User answers (via quiz sessions)
    const { data: sessions } = await supabaseAdmin
      .from("quiz_sessions")
      .select("id")
      .eq("user_id", user_id);
    
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      await supabaseAdmin.from("user_answers").delete().in("session_id", sessionIds);
    }
    
    await supabaseAdmin.from("quiz_sessions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("quiz_results").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_progress").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_badges").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_achievements").delete().eq("user_id", user_id);
    await supabaseAdmin.from("daily_streaks").delete().eq("user_id", user_id);
    await supabaseAdmin.from("leaderboard_entries").delete().eq("profile_id", user_id);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", user_id);
    await supabaseAdmin.from("ai_summary_jobs").delete().eq("user_id", user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    
    // 6) Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (profileDeleteError) {
      console.error("delete-user: failed to delete profile", profileDeleteError);
      return json({ error: "Failed to delete profile" }, 500);
    }

    // 7) Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error("delete-user: failed to delete auth user", authDeleteError);
      return json({ 
        success: true, 
        warning: "Profile deleted but auth user deletion failed",
        username: targetProfile.username 
      }, 200);
    }

    // 8) Audit log (target_user_id is null since user is deleted)
    await supabaseAdmin.from("admin_actions").insert([{
      admin_id: callerId,
      action_type: "delete_user",
      target_user_id: null,
      details: {
        deleted_user_id: user_id,
        deleted_username: targetProfile.username,
        deleted_at: new Date().toISOString(),
      },
    }]);

    console.log(`delete-user: successfully deleted user ${user_id} (${targetProfile.username})`);

    return json({ 
      success: true, 
      message: `User ${targetProfile.username} has been permanently deleted`,
      username: targetProfile.username 
    }, 200);

  } catch (e) {
    console.error("delete-user: unexpected error", e);
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
