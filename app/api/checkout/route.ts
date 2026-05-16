import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOptionalUser } from '@/lib/server-auth';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

type CheckoutItemInput = {
  productId?: string;
  amount?: number;
  quantity?: number;
};

type CustomerInfo = {
  name?: string;
  phone?: string;
  email?: string;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  note?: string;
  paymentMethod?: string;
};

function normalizeAddress(info?: CustomerInfo | null, fallback?: string | null) {
  const parts = [info?.address, info?.ward, info?.district, info?.province]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : fallback || null;
}

function normalizePaymentMethod(value?: string) {
  return value === "vnpay" ? "vnpay" : "cod";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items as CheckoutItemInput[];
    const customerInfo = (body.customerInfo ?? body.form ?? null) as CustomerInfo | null;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to purchase' }, { status: 400 });
    }

    const { user } = await getOptionalUser(req);
    const userId = user?.id ?? null;

    const quantities = new Map<string, number>();
    for (const item of items) {
      const productId = String(item.productId ?? "").trim();
      const quantity = Math.max(1, Math.floor(Number(item.amount ?? item.quantity ?? 1)));
      if (!productId || !Number.isFinite(quantity)) {
        return NextResponse.json({ error: "Invalid checkout item" }, { status: 400 });
      }
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const productIds = Array.from(quantities.keys());
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("product_id, price, promoted_price, stock, is_for_sale")
      .in("product_id", productIds);

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: "Some products are no longer available" }, { status: 400 });
    }

    let subtotal = 0;
    let stockError: string | null = null;
    const orderItemsPayload = products.map((product) => {
      const quantity = quantities.get(product.product_id) ?? 1;
      const stock = Number(product.stock ?? 0);
      if (product.is_for_sale === false || stock < quantity) {
        stockError = `Product ${product.product_id} is out of stock`;
      }
      const price = Number(product.promoted_price ?? product.price ?? 0);
      subtotal += price * quantity;
      return {
        order_id: "",
        product_id: product.product_id,
        quantity,
        price_at_purchase: price,
        is_gift: false,
      };
    });

    if (stockError) {
      return NextResponse.json({ error: stockError }, { status: 400 });
    }

    const couponCode = String(body.couponCode ?? "").trim().toUpperCase();
    const discount = couponCode === "DALATSPECIAL" ? Math.round(subtotal * 0.1) : 0;
    const shippingFee = couponCode === "FREESHIP" || subtotal >= 500000 ? 0 : 30000;
    const total = Math.max(0, subtotal + shippingFee - discount);
    const nowIso = new Date().toISOString();
    const customerAddress = normalizeAddress(customerInfo, body.address);
    
    const orderPayload: Record<string, string | number | null> = {
      total_price: total,
      delivery_started_at: null,
      estimated_arrival_at: null,
      created_at: nowIso,
      customer_name: customerInfo?.name || null,
      customer_phone: customerInfo?.phone || null,
      customer_address: customerAddress,
      payment_method: normalizePaymentMethod(customerInfo?.paymentMethod),
    };

    if (userId && customerInfo) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        full_name: customerInfo.name,
        phone_number: customerInfo.phone,
        address: customerAddress,
      }, { onConflict: 'user_id' });
      
      if (profileError) {
        console.warn("Could not upsert profile, keeping order attached to user:", profileError);
      }
    }
    
    if (userId) {
      orderPayload.user_id = userId;
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
    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload.map((item) => ({ ...item, order_id: orderId })));

    if (itemsInsertError) {
      console.error('DATABASE - Order items insert failed:', itemsInsertError);
      return NextResponse.json({ error: 'Order items insert failed', details: itemsInsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId, subtotal, discount, shippingFee, total });
  } catch (e) {
    console.error('SERVER - Checkout error:', e);
    return NextResponse.json({ error: 'Unexpected error', details: String(e) }, { status: 500 });
  }
}
