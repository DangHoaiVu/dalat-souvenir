-- Run this once in Supabase SQL Editor so profile updates work in admin/customer pages.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;

INSERT INTO public.profiles (
  user_id,
  full_name,
  phone_number,
  address,
  latitude,
  longitude
) VALUES (
  'aaa6bc7d-c8a8-4822-835a-672d6f28190d',
  'Đặng Hoài Vũ',
  '',
  '',
  NULL,
  NULL
)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name;
