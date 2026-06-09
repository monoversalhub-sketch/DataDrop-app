import { createServerClient } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Get phone from query params
    const phone = request.nextUrl.searchParams.get('phone');

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone format
    const phoneRegex = /^(07|08|09)\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabase = createServerClient();

    // Query transactions
    const { data: orders, error } = await supabase
      .from('transactions')
      .select('id, status, data_plan_name, network, created_at')
      .eq('phone_number', phone)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('[Lookup] Query error:', error);
      return new Response(
        JSON.stringify({ orders: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ orders: orders || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Lookup] Error:', err);
    return new Response(
      JSON.stringify({ orders: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
