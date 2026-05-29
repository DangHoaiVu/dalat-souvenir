-- Run in Supabase SQL Editor before demo/deploy if the production schema is older
-- than the current codebase.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS fixed_price numeric;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promoted_price numeric,
  ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT true;
