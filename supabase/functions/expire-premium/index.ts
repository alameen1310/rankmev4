import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find all expired premium users
    const { data: expiredUsers, error: selectError } = await supabase
      .from('profiles')
      .select('id, username, premium_expires_at')
      .eq('is_premium', true)
      .lt('premium_expires_at', new Date().toISOString());

    if (selectError) {
      console.error('Error finding expired users:', selectError);
      return new Response(
        JSON.stringify({ error: 'Failed to find expired users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('No expired premium users found');
      return new Response(
        JSON.stringify({ success: true, expired_count: 0, message: 'No expired users' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Expire all premium users
    const userIds = expiredUsers.map(u => u.id);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_premium: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds);

    if (updateError) {
      console.error('Error expiring users:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to expire users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications to expired users
    const notifications = expiredUsers.map(user => ({
      user_id: user.id,
      type: 'premium_expired',
      title: '⏰ Premium Expired',
      message: 'Your premium subscription has expired. Renew to continue enjoying premium features!',
      data: { expired_at: user.premium_expires_at },
    }));

    await supabase.from('notifications').insert(notifications);

    console.log(`Expired premium for ${expiredUsers.length} users:`, userIds);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredUsers.length,
        expired_users: expiredUsers.map(u => ({ id: u.id, username: u.username })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Expire premium error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
