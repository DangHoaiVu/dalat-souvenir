import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabaseClient';
import type { NextRequest } from 'next/server';

const supabase = createAdminSupabaseClient();

function toDbPayload(body: any) {
  return {
    name: body.name,
    start_date: body.start_date || new Date().toISOString(),
    end_date: body.end_date,
    image: body.image || null,
    is_active: body.is_active ?? true,
    fixed_price: body.fixed_price != null ? Number(body.fixed_price) : null,
    description: body.description || null,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: true });

    if (error) {
      console.error('[API/Promotions] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = toDbPayload(body);
    
    const { data, error } = await supabase
      .from('promotions')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('[API/Promotions] Create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { promotion_id, id, ...rest } = body;
    const promoId = promotion_id || id;
    
    if (!promoId) {
      return NextResponse.json({ error: "Missing promotion_id or id" }, { status: 400 });
    }

    const payload = toDbPayload(rest);
    
    const { data, error } = await supabase
      .from('promotions')
      .update(payload)
      .eq('promotion_id', promoId)
      .select('*');

    if (error) {
      console.error('[API/Promotions] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No promotion updated or multiple rows returned" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing promotion id" }, { status: 400 });
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('promotion_id', id);

    if (error) {
      console.error('[API/Promotions] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

