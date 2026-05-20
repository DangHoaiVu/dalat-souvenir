import type { Product } from "@/types";

/** Stable cart line id (Supabase UUID or mock id). */
export function cartProductId(product: Product): string {
  return product.product_id;
}
