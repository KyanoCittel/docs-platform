-- Run this in the Supabase SQL Editor (Dashboard > SQL > New Query)

-- 1. Profiles table (extends auth.users with a role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 3. Docs table with full-text search
create table if not exists public.docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) stored
);

create index if not exists docs_search_idx on public.docs using gin(search_vector);
create index if not exists docs_category_idx on public.docs(category_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists docs_updated_at on public.docs;
create trigger docs_updated_at
  before update on public.docs
  for each row execute function public.set_updated_at();

-- 4. Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.docs enable row level security;

-- Profiles: anyone logged in can read; users update their own
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (auth.uid() is not null);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- Categories: public read, admin/editor write
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);

drop policy if exists "categories_editor_write" on public.categories;
create policy "categories_editor_write" on public.categories for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

-- Docs: public read (if published), admin/editor can write
drop policy if exists "docs_public_read" on public.docs;
create policy "docs_public_read" on public.docs for select using (published = true or auth.uid() is not null);

drop policy if exists "docs_editor_write" on public.docs;
create policy "docs_editor_write" on public.docs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

-- 5. Seed one category + one example doc (optional)
insert into public.categories (name, slug, sort_order) values ('Algemeen', 'algemeen', 1)
  on conflict (slug) do nothing;
