import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { items, userId: providedUserId, customerInfo } = await req.json(); // [{ productId, amount, priceAtPurchase, name, image }]
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to purchase' }, { status: 400 });
    }

    // Determine the user_id to use
    let userId: string | null = providedUserId || null;

    // If not provided in body, try to get from Supabase session (fallback)
    if (!userId) {
      const cookieStore = cookies();
      const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;
      if (supabaseAuthToken) {
        const { data, error } = await supabase.auth.getUser(supabaseAuthToken);
        if (!error && data.user?.id) {
          userId = data.user.id;
        }
      }
    }


    // Insert order
    const total = items.reduce((sum, item) => sum + (Number(item.priceAtPurchase ?? 0) * Math.max(1, Math.floor(Number(item.amount ?? 1)))), 0);
    const nowIso = new Date().toISOString();
    
    const orderPayload: any = {
      total_price: total,
      delivery_started_at: null,
      estimated_arrival_at: null,
      created_at: nowIso,
      customer_name: customerInfo?.name || null,
      customer_phone: customerInfo?.phone || null,
      customer_address: customerInfo?.address || null,
      payment_method: customerInfo?.paymentMethod || 'cod',
    };
    // Attempt to upsert profile if logged in
    let finalUserId = userId;
    if (userId && customerInfo) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        full_name: customerInfo.name,
        phone_number: customerInfo.phone,
        address: customerInfo.address,
      }, { onConflict: 'user_id' });
      
      if (profileError) {
         console.warn("Could not upsert profile, falling back to guest order:", profileError);
         finalUserId = null; // Fallback to guest so foreign key constraint doesn't fail
      }
    }
    
    if (finalUserId) {
      orderPayload.user_id = finalUserId;
    }
    
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('order_id')
      .single();

    if (orderError) {
      console.error('DATABASE - Order creation failed:', orderError);
      return NextResponse.json({ error: 'Order creation failed', details: orderError.message }, { status: 500 });
    }

    const orderId = orderRow.order_id;
    
    // Insert order_items
    const orderItemsPayload = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: Math.max(1, Math.floor(Number(item.amount ?? 1))),
      price_at_purchase: Number(item.priceAtPurchase ?? 0),
      is_gift: false,
    }));

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsInsertError) {
      console.error('DATABASE - Order items insert failed:', itemsInsertError);
      return NextResponse.json({ error: 'Order items insert failed', details: itemsInsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId });
  } catch (e) {
    console.error('SERVER - Checkout error:', e);
    return NextResponse.json({ error: 'Unexpected error', details: String(e) }, { status: 500 });
  }
}
