import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PREMIUM_AMOUNT = 200000; // ₦2,000 in kobo
const PREMIUM_DAYS = 30;

Deno.serve(async (req) => {
  // Webhooks don't need CORS, only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (!signature) {
      console.error('No signature provided');
      return new Response('No signature', { status: 400 });
    }

    const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event, event.data?.reference);

    // Only process successful charges
    if (event.event !== 'charge.success') {
      console.log('Ignoring event:', event.event);
      return new Response('OK', { status: 200 });
    }

    const transaction = event.data;
    const reference = transaction.reference;
    const amount = transaction.amount;
    const userId = transaction.metadata?.user_id;

    // Validate amount
    if (amount < PREMIUM_AMOUNT) {
      console.error('Invalid amount:', amount, 'expected:', PREMIUM_AMOUNT);
      return new Response('Invalid amount', { status: 200 }); // Return 200 to acknowledge
    }

    if (!userId) {
      console.error('No user_id in metadata');
      return new Response('No user_id', { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this payment was already processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('status')
      .eq('reference', reference)
      .single();

    if (existingPayment?.status === 'success') {
      console.log('Payment already processed:', reference);
      return new Response('Already processed', { status: 200 });
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .upsert({
        user_id: userId,
        reference,
        amount,
        currency: transaction.currency || 'NGN',
        status: 'success',
        channel: transaction.channel,
        paid_at: transaction.paid_at,
        metadata: transaction,
      }, { onConflict: 'reference' });

    if (paymentError) {
      console.error('Failed to update payment:', paymentError);
    }

    // Get current premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single();

    // Calculate new expiry date (extend if already premium)
    let newExpiryDate: Date;
    if (profile?.is_premium && profile?.premium_expires_at) {
      const currentExpiry = new Date(profile.premium_expires_at);
      if (currentExpiry > new Date()) {
        // Extend from current expiry
        newExpiryDate = new Date(currentExpiry.getTime() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      } else {
        // Expired, start fresh
        newExpiryDate = new Date(Date.now() + PREMIUM_DAYS * 24 * 60 * 60 * 1000);
      }
    } else {
      // New premium
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
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update premium status:', updateError);
      return new Response('DB error', { status: 500 });
    }

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'premium',
      title: '🎉 Premium Activated!',
      message: `Your premium subscription is now active until ${newExpiryDate.toLocaleDateString()}!`,
      data: { premium_expires_at: newExpiryDate.toISOString(), reference },
    });

    console.log(`Premium activated for user ${userId} via webhook, expires: ${newExpiryDate.toISOString()}`);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Server error', { status: 500 });
  }
});
