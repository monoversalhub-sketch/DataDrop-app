import { createServerClient } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { reference } = params;

    // Initialize Supabase
    const supabase = createServerClient();

    // Query transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('status, data_plan_name, network')
      .eq('payment_reference', reference)
      .single();

    if (error || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Order not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: transaction.status,
        data_plan_name: transaction.data_plan_name,
        network: transaction.network,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Status] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
