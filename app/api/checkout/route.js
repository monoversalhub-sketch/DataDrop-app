import { createServerClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/ratelimit';
import { createVirtualAccount } from '@/lib/payments';
import { PLANS } from '@/lib/plans';

export async function POST(request) {
  try {
    // 1. Get IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 2. Check rate limit
    const { allowed, retryAfter } = await checkRateLimit(ip, {
      max: 3,
      window_seconds: 600,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: `Too many requests. Try again in ${retryAfter} seconds.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { phone_number, alternative_contact, network, data_plan_id } = body;

    // 4. Validate inputs
    const phoneRegex = /^(07|08|09)\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid phone number. Must be 11 digits starting with 07, 08, or 09.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['MTN', 'Airtel', 'Glo', '9mobile'].includes(network)) {
      return new Response(
        JSON.stringify({ error: 'Invalid network.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const plan = PLANS[data_plan_id];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: 'Invalid data plan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Derive pricing from lib/plans.js
    const cost_amount = plan.retail_price;
    const wholesale_cost = plan.wholesale_price;
    const data_plan_name = plan.name;

    // 6. Generate payment reference
    const payment_reference = crypto.randomUUID();

    // 7. Calculate expires_at
    const VA_EXPIRY_MINUTES = parseInt(process.env.VA_EXPIRY_MINUTES) || 20;
    const expires_at = new Date(Date.now() + VA_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // 8. Create virtual account
    let vaData;
    try {
      vaData = await createVirtualAccount({
        amount: cost_amount,
        reference: payment_reference,
        expires_minutes: VA_EXPIRY_MINUTES,
      });
    } catch (err) {
      console.error('[Checkout] VA creation failed:', err.message);
      return new Response(
        JSON.stringify({
          error: 'Failed to create virtual account. Please try again.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 9. Initialize Supabase and insert transaction
    const supabase = createServerClient();

    const { error: insertError } = await supabase.from('transactions').insert([
      {
        phone_number,
        alternative_contact: alternative_contact || null,
        network,
        data_plan_id,
        data_plan_name,
        cost_amount,
        wholesale_cost,
        payment_reference,
        virtual_account_num: vaData.virtual_account_num,
        virtual_bank_name: vaData.virtual_bank_name,
        expires_at,
        status: 'pending',
      },
    ]);

    if (insertError) {
      console.error('[Checkout] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 10. Return response
    return new Response(
      JSON.stringify({
        virtual_account_num: vaData.virtual_account_num,
        virtual_bank_name: vaData.virtual_bank_name,
        payment_reference,
        expires_at,
        amount: cost_amount,
        data_plan_name,
        network,
        phone_number,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Checkout] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
