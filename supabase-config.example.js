/*
  Copy to supabase-config.js (gitignored) and set your project values.

  Storage (for profile + highlight uploads):
  1. Supabase Dashboard → Storage → New bucket → name it the same as
     SUPABASE_STORAGE_BUCKET below (default: athlete-intake).
  2. Mark the bucket Public if you want getPublicUrl() links to work for everyone.
  3. SQL Editor → run policies (adjust bucket name if needed):

  insert into storage.buckets (id, name, public)
  values ('athlete-intake', 'athlete-intake', true)
  on conflict (id) do update set public = excluded.public;

  create policy "Public read athlete-intake"
  on storage.objects for select
  using (bucket_id = 'athlete-intake');

  create policy "Anon upload athlete-intake"
  on storage.objects for insert
  with check (bucket_id = 'athlete-intake');
*/
window.SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
window.SUPABASE_STORAGE_BUCKET = 'athlete-intake';
