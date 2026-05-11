import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

async function testFetchActive() {
  const { data, error } = await adminSupabase
    .from("promotions")
    .select("*")
    .eq("is_active", true);

  console.log('--- Fetch Active Promotion Result ---');
  console.log('Error:', error);
  console.log('Data length:', data?.length);
  if (data && data.length > 0) {
    console.log('First Item Name:', data[0].name);
    
    const todayStr = new Date().toLocaleDateString('en-CA');
    console.log('Today (en-CA):', todayStr);
    
    const activePromo = data.find(p => {
      const startStr = new Date(p.start_date).toLocaleDateString('en-CA');
      const endStr = new Date(p.end_date).toLocaleDateString('en-CA');
      return todayStr >= startStr && todayStr <= endStr;
    });
    
    console.log('Found Active Promo:', activePromo?.name || 'None');
    console.log('Final Result (activePromo || data[0]):', (activePromo || data[0]).name);
  } else {
    console.log('Result: null');
  }
}

testFetchActive();
