
import { supabase, createAdminSupabaseClient } from './lib/supabaseClient';

async function test() {
  const adminSupabase = createAdminSupabaseClient();
  const { data, error } = await adminSupabase
    .from("products")
    .select(`
      *, 
      category:categories(name),
      promotion_items!product_id(
        gift_product:products!gift_product_id(*),
        promotions(is_active, start_date, end_date)
      )
    `)
    .eq("is_for_sale", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Supabase Error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log('Data returned count:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample product:', data[0].name);
    console.log('Promotion join:', !!data[0].promotion_items);
  }
}

test();
