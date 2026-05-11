import { createAdminSupabaseClient } from './lib/supabaseClient';

async function debug() {
  const adminSupabase = createAdminSupabaseClient();
  const today = new Date().toISOString();
  console.log('Today ISO:', today);
  
  const { data: all, error: errAll } = await adminSupabase.from('promotions').select('*');
  console.log('All promotions:', all);

  const { data: active, error } = await adminSupabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  console.log('Filtered Active:', active);
}

debug();
