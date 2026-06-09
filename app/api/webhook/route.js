import { createServerClient } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/payments';
import { deliverData } from '@/lib/vtu';
import { sendWhatsApp, MESSAGES } from '@/lib/notify';
import { PLANS } from '@/lib/plans';

export async function POST(request) {
  try {
    // 1. Read raw body for HMAC
    const rawBody = await request.text();

    // 2. Extract signature
    const provider = process.env.PAYMENT_GATEWAY || 'monnify';
    const signature =
      request.headers.get('x-monnify-signature') ||
      request.headers.get('x-flutterwave-signature');

    if (!signature) {
      console.warn('[Webhook] No signature found');
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify HMAC
    const isValid = verifyWebhookSignature(rawBody, signature, provider);
    if (!isValid) {
      console.warn('[Webhook] Signature verification failed');
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Parse body
    const body = JSON.parse(rawBody);

    // 5. Extract payment reference
    let payment_reference;
    if (provider === 'monnify') {
      payment_reference = body.eventData?.paymentReference;
    } else if (provider === 'flutterwave') {
      payment_reference = body.data?.tx_ref;
    }

    if (!payment_reference) {
      console.warn('[Webhook] No payment reference found');
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Initialize Supabase and fetch transaction
    const supabase = createServerClient();

    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_reference', payment_reference)
      .single();

    if (fetchError || !transaction) {
      console.warn('[Webhook] Transaction not found:', payment_reference);
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 7. Idempotency guard
    if (transaction.status === 'success') {
      console.log('[Webhook] Already processed:', payment_reference);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 8. Check expiry
    if (new Date() > new Date(transaction.expires_at)) {
      await supabase
        .from('transactions')
        .update({ status: 'expired' })
        .eq('payment_reference', payment_reference);

      if (transaction.alternative_contact) {
        await sendWhatsApp(
          transaction.alternative_contact,
          MESSAGES.expired()
        );
      }

      console.log('[Webhook] Transaction expired:', payment_reference);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 9. Update status to processing
    await supabase
      .from('transactions')
      .update({ status: 'processing' })
      .eq('payment_reference', payment_reference);

    // 10. Deliver data (with fallback)
    const plan = PLANS[transaction.data_plan_id];
    if (!plan) {
      console.error('[Webhook] Plan not found:', transaction.data_plan_id);
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          error_log: 'Plan not found in configuration.',
        })
        .eq('payment_reference', payment_reference);

      if (transaction.alternative_contact) {
        await sendWhatsApp(
          transaction.alternative_contact,
          MESSAGES.failed(transaction.cost_amount)
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const vtuResult = await deliverData({
      network: transaction.network,
      phone: transaction.phone_number,
      plan_code: plan.vtu_plan_code,
    });

    if (vtuResult.success) {
      // Success
      await supabase
        .from('transactions')
        .update({
          status: 'success',
          aggregator_reference: vtuResult.reference,
        })
        .eq('payment_reference', payment_reference);

      console.log('[Webhook] Data delivered:', payment_reference);
    } else {
      // Failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          error_log: vtuResult.error,
        })
        .eq('payment_reference', payment_reference);

      if (transaction.alternative_contact) {
        await sendWhatsApp(
          transaction.alternative_contact,
          MESSAGES.failed(transaction.cost_amount)
        );
      }

      console.error('[Webhook] Delivery failed:', vtuResult.error);
    }

    // 11. Return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
