import type { Category, Product } from "@/types";

import { slugify } from "@/lib/slug";

export interface SupabaseCategoryRow {
  category_id: string;
  name: string;
}

export interface SupabaseProductRow {
  product_id: string;
  category_id: string | null;
  name: string;
  unit: string;
  description: string | null;
  price: number | string;
  stock: number | null;
  image: string | null;
  promoted_price: number | string | null;
  is_for_sale?: boolean | null;
  created_at?: string;
  category?: { name: string } | null;
  // Join data for active gifts
  promotion_items?: Array<{
    gift_product: SupabaseProductRow;
    promotions: { 
      is_active?: boolean;
      start_date: string;
      end_date: string;
    };
  }> | null;
}

function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v);
}

function tagFromProductId(productId: string): string[] {
  let hash = 0;
  for (let i = 0; i < productId.length; i += 1) {
    hash = (hash + productId.charCodeAt(i) * (i + 1)) % 10007;
  }
  return hash % 2 === 0 ? ["Mới"] : ["Bán chạy"];
}

export function mapCategoryRow(
  row: SupabaseCategoryRow & { products?: { count: number | string }[] | null },
  productCount?: number,
): Category {
  const count =
    productCount ??
    (Array.isArray(row.products) && row.products[0]?.count !== undefined
      ? Number(row.products[0].count)
      : 0);
  const slug = slugify(row.name);
  return {
    category_id: row.category_id,
    name: row.name,
    slug,
    productCount: count,
    image: `https://picsum.photos/seed/cat-${slug}/200/200`,
  };
}

export function mapProductRow(row: SupabaseProductRow): Product {
  const listPrice = num(row.price);
  const promo = row.promoted_price != null ? num(row.promoted_price) : null;
  const hasPromo = promo !== null && promo > 0 && promo < listPrice;
  const salePrice = hasPromo ? promo : listPrice;
  // If we have a promo, the original price is the compare price. 
  // If not, comparePrice matches salePrice exactly to avoid cross-through in UI.
  const comparePrice = hasPromo ? listPrice : salePrice;
  const categoryName = row.category?.name ?? "";
  const slug = slugify(row.name);
  const primaryImage =
    row.image?.trim() ||
    `https://picsum.photos/seed/${encodeURIComponent(slug).slice(0, 40)}/600/600`;

  const categorySlug = categoryName ? slugify(categoryName) : "danh-muc";
  const category: Category = {
    category_id: row.category_id ?? undefined,
    name: categoryName,
    slug: categorySlug,
  };

  const desc =
    row.description?.trim() ||
    `${row.name} lấy cảm hứng từ Đà Lạt, phù hợp làm quà tặng, kỷ niệm du lịch hoặc món nhỏ để giữ lại một góc thành phố sương mù.`;
  const story = `${row.name} được chọn theo tinh thần nhẹ nhàng, tinh tế của Đà Lạt, dễ gói quà và dễ mang theo sau mỗi chuyến đi.`;

  return {
    product_id: row.product_id,
    category_id: row.category_id ?? "",
    name: row.name,
    slug,
    description: desc,
    story,
    price: salePrice,
    comparePrice,
    images: [primaryImage],
    image: primaryImage,
    unit: row.unit,
    weightGram: 200,
    stock: row.stock ?? 0,
    category,
    avgRating: 4.5,
    reviewCount: 18,
    tags: tagFromProductId(row.product_id),
    is_for_sale: row.is_for_sale ?? true,
    createdAt: row.created_at,
    promoted_gift: (() => {
      const items = row.promotion_items;
      if (!items || !Array.isArray(items) || items.length === 0) return undefined;
      
      const today = new Date();
      // Set to start of day for comparison
      today.setHours(0, 0, 0, 0);
      
      const activeItem = items.find(pItem => {
        // Handle both object and array response from Supabase join
        const promo = Array.isArray(pItem.promotions) ? pItem.promotions[0] : pItem.promotions;
        
        if (!promo || promo.is_active === false || !pItem.gift_product) return false;
        
        const startStr = promo.start_date;
        const endStr = promo.end_date;
        
        if (!startStr || !endStr) return false;
        
        // Use string-based comparison for YYYY-MM-DD for maximum reliability
        const todayStr = new Date().toLocaleDateString('en-CA');
        const start = startStr.split('T')[0];
        const end = endStr.split('T')[0];
        
        return todayStr >= start && todayStr <= end;
      });

      if (!activeItem || !activeItem.gift_product) return undefined;

      // Map gift product but prevent deep recursion by clearing its promotion_items
      const giftData = { ...activeItem.gift_product, promotion_items: null };
      return mapProductRow(giftData as SupabaseProductRow);
    })(),
  };
}
