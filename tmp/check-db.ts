import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPromotions() {
  const { data, error } = await supabase.from('promotions').select('*');
  if (error) {
    console.error('Error fetching promotions:', error);
    return;
  }
  console.log('--- Database Promotions ---');
  console.log(JSON.stringify(data, null, 2));
}

checkPromotions();
