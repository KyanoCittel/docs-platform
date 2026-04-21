-- Migratie v3: alleen ingelogde gebruikers mogen docs + categorieën lezen.
-- Run dit in Supabase SQL Editor na de eerdere migraties.

-- Docs: alleen lezen als je ingelogd bent. Drafts alleen voor editor/admin.
drop policy if exists "docs_public_read" on public.docs;
drop policy if exists "docs_read" on public.docs;
create policy "docs_read" on public.docs for select using (
  case
    when not published then exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')
    )
    else auth.uid() is not null
  end
);

-- Categorieën ook alleen voor ingelogde users
drop policy if exists "categories_public_read" on public.categories;
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (auth.uid() is not null);
