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

    const { user_id, make_admin } = await req.json();
    
    if (!user_id || make_admin === undefined) {
      return json({ error: "Missing user_id or make_admin" }, 400);
    }

    // 1) Identify caller via JWT
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData?.user) {
      console.error("toggle-admin: auth.getUser failed", userError);
      return json({ error: "Unauthenticated" }, 401);
    }

    const callerId = userData.user.id;
    console.log("toggle-admin: caller =", callerId, "target =", user_id, "make_admin =", make_admin);

    // 2) Use service role for admin check + updates (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
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

    const isCallerAdmin = roleData?.role === "admin" || callerProfile?.is_admin === true;

    if (!isCallerAdmin) {
      return json({ error: "Forbidden (admin only)" }, 403);
    }

    // Prevent self-demotion
    if (callerId === user_id && !make_admin) {
      return json({ error: "Cannot remove your own admin status" }, 400);
    }

    // 3) Get target user's profile
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("id", user_id)
      .single();

    if (targetError || !targetProfile) {
      console.error("toggle-admin: target user not found", targetError);
      return json({ error: "User not found" }, 404);
    }

    // 4) Update user_roles table (proper RBAC)
    if (make_admin) {
      // Add admin role
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .upsert([{
          user_id: user_id,
          role: "admin",
        }], { onConflict: "user_id,role" });

      if (insertError) {
        console.error("toggle-admin: insert role failed", insertError);
        return json({ error: "Failed to add admin role" }, 500);
      }
    } else {
      // Remove admin role
      const { error: deleteError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");

      if (deleteError) {
        console.error("toggle-admin: delete role failed", deleteError);
        return json({ error: "Failed to remove admin role" }, 500);
      }
    }

    // 5) Also update legacy is_admin flag on profiles for compatibility
    await supabaseAdmin
      .from("profiles")
      .update({ 
        is_admin: make_admin,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    // 6) Create notification for the user
    await supabaseAdmin.from("notifications").insert([{
      user_id: user_id,
      type: "system",
      title: make_admin ? "🛡️ Admin Access Granted" : "🛡️ Admin Access Removed",
      message: make_admin 
        ? "You have been promoted to admin! You can now access the admin dashboard from your profile page."
        : "Your admin access has been revoked.",
    }]);

    // 7) Audit log
    await supabaseAdmin.from("admin_actions").insert([{
      admin_id: callerId,
      action_type: make_admin ? "make_admin" : "remove_admin",
      target_user_id: user_id,
      details: {
        username: targetProfile.username,
        action: make_admin ? "granted admin" : "revoked admin",
      },
    }]);

    console.log(`toggle-admin: ${targetProfile.username} admin status -> ${make_admin}`);

    return json({ 
      success: true, 
      message: `${targetProfile.username} is ${make_admin ? 'now' : 'no longer'} an admin`,
      username: targetProfile.username,
      is_admin: make_admin,
    }, 200);

  } catch (e) {
    console.error("toggle-admin: unexpected error", e);
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
