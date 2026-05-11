
import { createAdminSupabaseClient } from "../lib/supabaseClient";
import { mapProductRow } from "../lib/map-supabase-product";

async function check() {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *,
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(*),
        promotions(promotion_id, is_active, start_date, end_date)
      )
    `)
    .eq("is_for_sale", true);

  if (error) {
    console.error(error);
  } else {
    const mapped = data.map(mapProductRow);
    const withGifts = mapped.filter(p => p.promoted_gift);
    console.log("Found", withGifts.length, "products with active gifts.");
    withGifts.forEach(p => {
      console.log(`- ${p.name}: Gift is ${p.promoted_gift?.name}`);
    });
  }
}

check();
