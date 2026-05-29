-- Create public Supabase Storage buckets used by the admin image upload flow.
-- The application uploads through the server-side /api/storage/upload route,
-- so write access does not need to be granted to browser clients.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('Products', 'Products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('Promotions', 'Promotions', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admin read product promotion images'
  ) then
    create policy "Admin read product promotion images"
      on storage.objects
      for select
      to public
      using (bucket_id in ('Products', 'Promotions'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admin upload product promotion images'
  ) then
    create policy "Admin upload product promotion images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id in ('Products', 'Promotions')
        and lower(coalesce(auth.jwt() ->> 'email', '')) in ('danghoaivu2004@gmail.com', 'admin@shopluuniem.vn')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admin update product promotion images'
  ) then
    create policy "Admin update product promotion images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id in ('Products', 'Promotions')
        and lower(coalesce(auth.jwt() ->> 'email', '')) in ('danghoaivu2004@gmail.com', 'admin@shopluuniem.vn')
      )
      with check (
        bucket_id in ('Products', 'Promotions')
        and lower(coalesce(auth.jwt() ->> 'email', '')) in ('danghoaivu2004@gmail.com', 'admin@shopluuniem.vn')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admin delete product promotion images'
  ) then
    create policy "Admin delete product promotion images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id in ('Products', 'Promotions')
        and lower(coalesce(auth.jwt() ->> 'email', '')) in ('danghoaivu2004@gmail.com', 'admin@shopluuniem.vn')
      );
  end if;
end $$;
