import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/server-auth';
import type { NextRequest } from 'next/server';

const supabase = createAdminSupabaseClient();

type PromotionPayload = {
  name?: string;
  start_date?: string;
  end_date?: string;
  image?: string | null;
  is_active?: boolean;
  fixed_price?: number | string | null;
  description?: string | null;
};

function toDbPayload(body: PromotionPayload) {
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

function isMissingColumnError(error: unknown) {
  const err = error as { code?: string; message?: string };
  return err?.code === "42703" || err?.code === "PGRST204" || /column .* does not exist/i.test(err?.message ?? "");
}

function removeMissingColumn<T extends Record<string, unknown>>(payload: T, error: unknown): T {
  const message = (error as { message?: string })?.message ?? "";
  const match = message.match(/column\s+(?:promotions\.)?["']?([a-z_]+)["']?\s+does not exist/i)
    ?? message.match(/'([a-z_]+)'\s+column/i);

  if (!match?.[1] || !(match[1] in payload)) {
    return payload;
  }

  const next = { ...payload };
  delete next[match[1]];
  return next;
}

function normalizePromotion(row: Record<string, unknown>): Record<string, unknown> & {
  is_active: boolean;
  fixed_price: unknown;
  description: unknown;
  start_date?: unknown;
} {
  const start = row.start_date ? new Date(String(row.start_date)).getTime() : 0;
  const end = row.end_date ? new Date(String(row.end_date)).getTime() : 0;
  const now = Date.now();

  return {
    ...row,
    is_active: typeof row.is_active === "boolean" ? row.is_active : start <= now && now <= end,
    fixed_price: row.fixed_price ?? null,
    description: row.description ?? null,
  };
}

async function insertPromotion(payload: Record<string, unknown>) {
  let current = payload;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase.from('promotions').insert(current).select('*').single();
    if (!error) return { data, error };
    if (!isMissingColumnError(error)) return { data, error };
    const next = removeMissingColumn(current, error);
    if (next === current || Object.keys(next).length === Object.keys(current).length) return { data, error };
    current = next;
  }
  return { data: null, error: { message: "Unable to write promotion" } };
}

async function updatePromotion(promoId: string, payload: Record<string, unknown>) {
  let current = payload;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from('promotions')
      .update(current)
      .eq('promotion_id', promoId)
      .select('*');
    if (!error) return { data, error };
    if (!isMissingColumnError(error)) return { data, error };
    const next = removeMissingColumn(current, error);
    if (next === current || Object.keys(next).length === Object.keys(current).length) return { data, error };
    current = next;
  }
  return { data: null, error: { message: "Unable to update promotion" } };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('[API/Promotions] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalized = (data || []).map((row) => normalizePromotion(row as Record<string, unknown>));
    normalized.sort((a, b) => Number(b.is_active) - Number(a.is_active) || new Date(String(a.start_date ?? "")).getTime() - new Date(String(b.start_date ?? "")).getTime());
    return NextResponse.json(normalized);
  } catch (error: unknown) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const payload = toDbPayload(body);
    if (!payload.name || !payload.end_date) {
      return NextResponse.json({ error: "Missing required promotion fields" }, { status: 400 });
    }
    
    const { data, error } = await insertPromotion(payload);

    if (error) {
      console.error('[API/Promotions] Create error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(normalizePromotion((data ?? {}) as Record<string, unknown>));
  } catch (error: unknown) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { promotion_id, id, ...rest } = body;
    const promoId = promotion_id || id;
    
    if (!promoId) {
      return NextResponse.json({ error: "Missing promotion_id or id" }, { status: 400 });
    }
    
    const payload = toDbPayload(rest);
    
    const { data, error } = await updatePromotion(promoId, payload);

    if (error) {
      console.error('[API/Promotions] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No promotion updated or multiple rows returned" }, { status: 404 });
    }

    return NextResponse.json(normalizePromotion(data[0] as Record<string, unknown>));
  } catch (error: unknown) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
  } catch (error: unknown) {
    console.error('[API/Promotions] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

