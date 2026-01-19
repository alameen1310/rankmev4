import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PREMIUM_AMOUNT = 200000; // ₦2,000 in kobo
const PREMIUM_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transaction = paystackData.data;

    // Check if payment was successful and amount is correct
    if (transaction.status !== 'success') {
      return new Response(
        JSON.stringify({ 
          error: 'Payment not successful', 
          verified: false,
          status: transaction.status 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (transaction.amount < PREMIUM_AMOUNT) {
      return new Response(
        JSON.stringify({ 
          error: 'Incorrect payment amount', 
          verified: false,
          expected: PREMIUM_AMOUNT,
          received: transaction.amount 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this payment belongs to the requesting user
    const paymentUserId = transaction.metadata?.user_id;
    if (paymentUserId && paymentUserId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Payment does not belong to this user', verified: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'success',
        channel: transaction.channel,
        paid_at: transaction.paid_at,
        metadata: transaction,
      })
      .eq('reference', reference);

    // Get current premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', user.id)
      .single();

    // Calculate new expiry date
    let newExpiryDate: Date;
    if (profile?.is_premium && profile?.premium_expires_at) {
      // Extend existing premium
      const currentExpiry = new Date(profile.premium_expires_at);
      if (currentExpiry > new Date()) {
        newExpiryDate = new Date(currentExpiry.getTime() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      } else {
        newExpiryDate = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      }
    } else {
      // New premium subscription
      newExpiryDate = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
    }

    // Update user's premium status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: newExpiryDate.toISOString(),
        last_payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update premium status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to activate premium', verified: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Premium activated for user ${user.id} until ${newExpiryDate.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        is_premium: true,
        premium_expires_at: newExpiryDate.toISOString(),
        message: 'Premium activated successfully!',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Verify payment error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
