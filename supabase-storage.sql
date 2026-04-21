-- Run this in Supabase SQL Editor (apart van supabase-schema.sql)
-- Zet een publieke 'docs-images' bucket op voor geplakte foto's in documenten.

insert into storage.buckets (id, name, public)
values ('docs-images', 'docs-images', true)
on conflict (id) do nothing;

-- Iedereen mag de foto's bekijken (bucket is public)
drop policy if exists "docs-images public read" on storage.objects;
create policy "docs-images public read" on storage.objects
  for select using (bucket_id = 'docs-images');

-- Alleen ingelogde editors/admins mogen uploaden
drop policy if exists "docs-images editor upload" on storage.objects;
create policy "docs-images editor upload" on storage.objects
  for insert with check (
    bucket_id = 'docs-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','editor')
    )
  );

-- Editors mogen hun eigen uploads verwijderen (optioneel, handig voor opruimen)
drop policy if exists "docs-images editor delete" on storage.objects;
create policy "docs-images editor delete" on storage.objects
  for delete using (
    bucket_id = 'docs-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','editor')
    )
  );
