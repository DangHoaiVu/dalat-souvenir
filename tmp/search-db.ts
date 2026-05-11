import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function searchEverything() {
  const query = '1 năm';
  const tables = ['promotions', 'products', 'categories', 'promotion_items', 'orders', 'profiles'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.log(`Error searching ${table}:`, error.message);
      continue;
    }
    
    const found = data.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
    if (found.length > 0) {
      console.log(`--- Found in ${table} ---`);
      console.log(found);
    }
  }
}

searchEverything();
