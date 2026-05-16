
import { NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/server-auth";
// Helper to map request body to DB payload
import type { NextRequest } from "next/server";
const supabase = createAdminSupabaseClient();

const PRODUCT_SELECT = `
  product_id,
  category_id,
  name,
  unit,
  description,
  price,
  stock,
  image,
  promoted_price,
  is_for_sale,
  created_at,
  category:categories(name),
  promotion_items:promotion_items!promotion_items_product_id_fkey(
    gift_product:products!promotion_items_gift_product_id_fkey(
      product_id,
      category_id,
      name,
      unit,
      description,
      price,
      stock,
      image,
      promoted_price,
      is_for_sale,
      created_at,
      category:categories(name)
    ),
    promotions(start_date, end_date)
  )
`;

const getProductsCached = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_for_sale", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data as unknown as SupabaseProductRow[]) ?? []).map(mapProductRow);
  },
  ["api-products"],
  { revalidate: 300, tags: ["products"] },
);
type ProductInput = {
  category_id?: string;
  name: string;
  unit?: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  is_for_sale?: boolean;
};
function toDbPayload(input: ProductInput) {
  return {
    category_id: input.category_id ?? null,
    name: input.name,
    unit: input.unit ?? null,
    description: input.description ?? null,
    price: input.price,
    stock: input.stock,
    image: input.image ?? null,
    is_for_sale: input.is_for_sale ?? true,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body?.name || !Number.isFinite(Number(body.price))) {
    return NextResponse.json({ error: "Missing required product fields" }, { status: 400 });
  }

  const payload = { ...toDbPayload(body), created_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select(PRODUCT_SELECT)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag("products");
  revalidateTag("categories");
  return NextResponse.json(mapProductRow(data as unknown as SupabaseProductRow));
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { product_id, id, ...rest } = body;
  const prodId = product_id || id;
  if (!prodId) {
    return NextResponse.json({ error: "Missing product_id or id" }, { status: 400 });
  }
  const payload = toDbPayload(rest);
  console.log("[API/PUT] Update payload:", payload, "for product_id:", prodId);
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("product_id", prodId)
    .select(PRODUCT_SELECT);
  console.log("[API/PUT] Supabase update result:", data, error);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || !Array.isArray(data) || data.length !== 1) {
    return NextResponse.json({ error: "No product updated or multiple rows returned" }, { status: 404 });
  }
  revalidateTag("products");
  revalidateTag("categories");
  return NextResponse.json(mapProductRow(data[0] as unknown as SupabaseProductRow));
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("id") || searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc("delete_product_with_image", {
    p_product_id: productId,
  });

  if (rpcError) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  revalidateTag("products");
  revalidateTag("categories");
  return NextResponse.json({ success: true });
}

export async function GET() {
  try {
    const data = await getProductsCached();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
