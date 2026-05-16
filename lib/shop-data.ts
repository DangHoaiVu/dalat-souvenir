import { mapCategoryRow, mapProductRow, type SupabaseProductRow } from "@/lib/map-supabase-product";
import { supabase, createAdminSupabaseClient } from "@/lib/supabaseClient";
import type { Category, Product } from "@/types";
import { unstable_noStore as noStore } from "next/cache";

export type ActivePromotion = {
  promotion_id: string;
  name: string;
  description: string;
  image: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  fixed_price?: number | null;
};

export type PromotionDetailItem = {
  product_id: string;
  gift_product_id?: string | null;
  product?: Product;
  gift_product?: Product | null;
};

export type PromotionDetails = ActivePromotion & {
  items: PromotionDetailItem[];
};

/** Fisher–Yates shuffle (in-place). */
export function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}



export async function fetchCategoriesForHome(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, name, products(count)")
    .neq("name", "Quà tặng kèm")
    .eq("products.is_for_sale", true)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) =>
    mapCategoryRow(
      {
        category_id: row.category_id,
        name: row.name,
        products: row.products as { count: number }[] | undefined,
      },
      undefined,
    ),
  );
}

export async function fetchProductsForHome(): Promise<Product[]> {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *, 
      category:categories(name),
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(*),
        promotions(start_date, end_date)
      )
    `)
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchProductsForHome error:", error);
    return [];
  }

  return (data as SupabaseProductRow[]).map(mapProductRow);
}

/** Random subset for “Bán chạy nhất” (not tied to sales metrics). */
export function pickRandomProducts(products: Product[], count: number): Product[] {
  if (!products || products.length === 0) return [];
  if (products.length <= count) return shuffle(products);
  return shuffle(products).slice(0, count);
}

/** Newest first for “Mới về”. */
export function pickNewestProducts(products: Product[], count: number): Product[] {
  return products.slice(0, count);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *, 
      category:categories(name),
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(*),
        promotions(start_date, end_date)
      )
    `)
    .eq("is_for_sale", true);

  if (error || !data) return null;

  const rows = data as SupabaseProductRow[];
  const found = rows.find((row) => mapProductRow(row).slug === slug);
  return found ? mapProductRow(found) : null;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *, 
      category:categories(name),
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(*),
        promotions(start_date, end_date)
      )
    `)
    .eq("product_id", id)
    .eq("is_for_sale", true)
    .single();

  if (error || !data) return null;
  return mapProductRow(data as SupabaseProductRow);
}

export async function fetchRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number,
): Promise<Product[]> {
  if (!categoryId) return [];

  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *, 
      category:categories(name),
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(*),
        promotions(start_date, end_date)
      )
    `)
    .eq("is_for_sale", true)
    .eq("category_id", categoryId)
    .neq("product_id", excludeProductId)
    .limit(limit * 2);

  if (error || !data) return [];

  const mapped = (data as SupabaseProductRow[]).map(mapProductRow);
  return pickRandomProducts(mapped, limit);
}

export async function fetchActivePromotion(): Promise<ActivePromotion | null> {
  const adminSupabase = createAdminSupabaseClient();

  const { data, error } = await adminSupabase
    .from("promotions")
    .select("*");

  if (error || !data || data.length === 0) return null;

  const promotions = data as ActivePromotion[];

  // Most robust date matching: convert everything to simple date strings (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  const activePromo = promotions.find((p) => {
    if (p.is_active === false) return false;
    const startStr = new Date(p.start_date).toLocaleDateString('en-CA');
    const endStr = new Date(p.end_date).toLocaleDateString('en-CA');
    
    // Inclusive range check
    return todayStr >= startStr && todayStr <= endStr;
  });

  return activePromo || null; 
}

export async function fetchPromotionDetails(id: string): Promise<Record<string, unknown> | null> {
  // Ensure we always fetch fresh data from Supabase for promotion details
  noStore();
  const adminSupabase = createAdminSupabaseClient();
  
  // 1. Fetch promotion details
  const { data: promotion, error: promoError } = await adminSupabase
    .from('promotions')
    .select('*')
    .eq('promotion_id', id)
    .single();

  if (promoError || !promotion) return null;

  // 2. Fetch items 
  const { data: items, error: itemsError } = await adminSupabase
    .from('promotion_items')
    .select('*')
    .eq('promotion_id', id);

  if (itemsError) return { ...promotion, items: [] };

  // 3. Enrich items with product data
  let enrichedItems: PromotionDetailItem[] = [];
  if (items && items.length > 0) {
    const productIds = items.map(i => i.product_id);
    const giftIds = items.map(i => i.gift_product_id).filter(Boolean);
    const allIds = Array.from(new Set([...productIds, ...(giftIds as string[])]));
    
    const { data: productsData } = await adminSupabase
      .from('products')
      .select('*, category:categories(name)')
      .in('product_id', allIds);

    const prodMap = (productsData || []).reduce<Record<string, Product>>((acc, p) => {
      const row = p as SupabaseProductRow;
      const productId = String((row as { product_id?: unknown }).product_id ?? "");
      if (!productId) return acc;
      acc[productId] = mapProductRow(row);
      return acc;
    }, {});

    enrichedItems = items.map((i) => ({
      ...i,
      product: prodMap[i.product_id],
      gift_product: i.gift_product_id ? prodMap[i.gift_product_id] : null
    }));
  }

  return { ...(promotion as ActivePromotion), items: enrichedItems };
}
