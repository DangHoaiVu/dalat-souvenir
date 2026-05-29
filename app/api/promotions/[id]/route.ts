import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/server-auth';
import type { NextRequest } from 'next/server';

const supabase = createAdminSupabaseClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch promotion details
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('promotion_id', id)
      .single();

    if (promoError) throw promoError;

    // Fetch items (simple fetch to confirm table access)
    const { data: items, error: itemsError } = await supabase
      .from('promotion_items')
      .select('*')
      .eq('promotion_id', id);

    if (itemsError) throw itemsError;

    // Manually join if items exist (more robust)
    let enrichedItems = [];
    if (items && items.length > 0) {
      const productIds = items.map(i => i.product_id);
      const giftIds = items.map(i => i.gift_product_id).filter(Boolean);
      const allIds = Array.from(new Set([...productIds, ...(giftIds as string[])]));
      
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('product_id', allIds);

      const prodMap = (productsData || []).reduce((acc: any, p: any) => {
        acc[p.product_id] = p;
        return acc;
      }, {});

      enrichedItems = items.map(i => ({
        ...i,
        product: prodMap[i.product_id],
        gift_product: i.gift_product_id ? prodMap[i.gift_product_id] : null
      }));
    }

    return NextResponse.json({ ...promotion, items: enrichedItems });
  } catch (error: any) {
    console.error('[API/Promotions/Detail] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id: promotion_id } = params;
    const body = await req.json();
    const { product_id, product_ids, discount_percentage, gift_product_id, use_fixed_price } = body;

    const ids = product_ids || (product_id ? [product_id] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Missing product_id(s)' }, { status: 400 });
    }

    // 1. Fetch promotion to get fixed_price and active status
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('promotion_id', promotion_id)
      .single();

    if (promoError) throw promoError;

    // 2. Fetch products original prices
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('product_id, price')
      .in('product_id', ids);

    if (prodError) throw prodError;

    // 3. Prepare upsert labels
    const upsertRows = ids.map((pid: string) => ({
      promotion_id,
      product_id: pid,
      discount_percentage: use_fixed_price ? null : discount_percentage,
      gift_product_id: gift_product_id || null,
    }));

    // 4. Upsert promotion_items
    const { error: upsertError } = await supabase
      .from('promotion_items')
      .upsert(upsertRows, { onConflict: 'promotion_id, product_id' });

    if (upsertError) throw upsertError;

    // 5. Update promoted_price in products table if promotion is active
    if (promotion.is_active) {
      for (const product of products) {
        let promotedPrice = null;
        
        if (use_fixed_price && promotion.fixed_price) {
          // Only apply if fixed price is lower than or equal to current price
          if (promotion.fixed_price <= product.price) {
            promotedPrice = promotion.fixed_price;
          }
        } else if (discount_percentage && Number(discount_percentage) > 0) {
          promotedPrice = Math.round(product.price * (1 - Number(discount_percentage) / 100));
        }

        // Always update to current calculated promotedPrice (even if it's null, to reset it)
        await supabase
          .from('products')
          .update({ promoted_price: promotedPrice })
          .eq('product_id', product.product_id);
      }
    }

    revalidateTag('promotions');
    revalidateTag('products');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/Promotions/Detail] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id: promotion_id } = params;
    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
    }

    // 1. Delete promotion_item
    const { error: deleteError } = await supabase
      .from('promotion_items')
      .delete()
      .match({ promotion_id, product_id });

    if (deleteError) throw deleteError;

    // 2. Reset promoted_price in products table
    await supabase
      .from('products')
      .update({ promoted_price: null })
      .eq('product_id', product_id);

    revalidateTag('promotions');
    revalidateTag('products');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/Promotions/Detail] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
