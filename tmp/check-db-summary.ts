import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPromotions() {
  const { data, error } = await supabase.from('promotions').select('promotion_id, name, is_active, start_date, end_date');
  if (error) {
    console.error('Error fetching promotions:', error);
    return;
  }
  console.log('--- Database Promotions (Summary) ---');
  console.log(data);
}

checkPromotions();
