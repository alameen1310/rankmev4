import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      return json({ error: "Missing Authorization header" }, 401);
    }

    // Parse request body
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

    // Check if user has admin role
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

    // Optional: verify username matches for extra safety
    if (confirm_username && targetProfile.username !== confirm_username) {
      return json({ error: "Username confirmation does not match" }, 400);
    }

    console.log(`delete-user: admin ${callerId} deleting user ${user_id} (${targetProfile.username})`);

    // 4) Delete related data (order matters due to foreign keys)
    // Delete battle answers
    await supabaseAdmin.from("battle_answers").delete().eq("user_id", user_id);
    
    // Delete battle participants
    await supabaseAdmin.from("battle_participants").delete().eq("user_id", user_id);
    
    // Delete message reactions
    await supabaseAdmin.from("message_reactions").delete().eq("user_id", user_id);
    
    // Delete direct messages (sent and received)
    await supabaseAdmin.from("direct_messages").delete().eq("sender_id", user_id);
    await supabaseAdmin.from("direct_messages").delete().eq("receiver_id", user_id);
    
    // Delete friend requests
    await supabaseAdmin.from("friend_requests").delete().eq("from_user_id", user_id);
    await supabaseAdmin.from("friend_requests").delete().eq("to_user_id", user_id);
    
    // Delete friendships
    await supabaseAdmin.from("friendships").delete().eq("user_id", user_id);
    await supabaseAdmin.from("friendships").delete().eq("friend_id", user_id);
    
    // Delete notifications
    await supabaseAdmin.from("notifications").delete().eq("user_id", user_id);
    
    // Delete user answers
    const { data: sessions } = await supabaseAdmin
      .from("quiz_sessions")
      .select("id")
      .eq("user_id", user_id);
    
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      await supabaseAdmin.from("user_answers").delete().in("session_id", sessionIds);
    }
    
    // Delete quiz sessions
    await supabaseAdmin.from("quiz_sessions").delete().eq("user_id", user_id);
    
    // Delete quiz results
    await supabaseAdmin.from("quiz_results").delete().eq("user_id", user_id);
    
    // Delete user progress
    await supabaseAdmin.from("user_progress").delete().eq("user_id", user_id);
    
    // Delete user badges
    await supabaseAdmin.from("user_badges").delete().eq("user_id", user_id);
    
    // Delete user achievements
    await supabaseAdmin.from("user_achievements").delete().eq("user_id", user_id);
    
    // Delete daily streaks
    await supabaseAdmin.from("daily_streaks").delete().eq("user_id", user_id);
    
    // Delete leaderboard entries
    await supabaseAdmin.from("leaderboard_entries").delete().eq("profile_id", user_id);
    
    // Delete subscriptions
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", user_id);
    
    // Delete AI summary jobs
    await supabaseAdmin.from("ai_summary_jobs").delete().eq("user_id", user_id);
    
    // Delete user roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    
    // Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (profileDeleteError) {
      console.error("delete-user: failed to delete profile", profileDeleteError);
      return json({ error: "Failed to delete profile" }, 500);
    }

    // 5) Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error("delete-user: failed to delete auth user", authDeleteError);
      // Profile is already deleted, log but don't fail completely
      return json({ 
        success: true, 
        warning: "Profile deleted but auth user deletion failed",
        username: targetProfile.username 
      }, 200);
    }

    // 6) Audit log
    await supabaseAdmin.from("admin_actions").insert([{
      admin_id: callerId,
      action_type: "delete_user",
      target_user_id: null, // User is deleted, can't reference
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
