
import { createAdminSupabaseClient } from "./lib/supabaseClient.js";

async function check() {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      name,
      promotion_items:promotion_items!promotion_items_product_id_fkey(
        gift_product:products!promotion_items_gift_product_id_fkey(name),
        promotions(promotion_id, is_active, start_date, end_date)
      )
    `)
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
