import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/'/g, '').trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/'/g, '').trim();
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAll() {
  const { data, error } = await adminSupabase.from("promotions").select("*");
  console.log('--- All Promotions in DB ---');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkAll();
