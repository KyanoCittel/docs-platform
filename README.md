# Documentatie Platform

Intern documentatieplatform met login, admin edit, en full-text search.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind 4**
- **Supabase** voor Postgres database + auth + full-text search
- Deploy op **Vercel** (gratis tier) — auto-deploy bij push naar GitHub

## Setup (eenmalig)

### 1. Supabase database opzetten

1. Open je project: https://supabase.com/dashboard/project/upsbodyrmzlufrunlbva
2. Ga naar **SQL Editor** → **New query**
3. Kopieer de inhoud van `supabase-schema.sql` en voer uit (klik Run)
4. Ga naar **Settings → API** en kopieer de **anon public** key

### 2. Env vars

Open `.env.local` en vul je Supabase anon key in:

```
NEXT_PUBLIC_SUPABASE_URL=https://upsbodyrmzlufrunlbva.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   <- vul hier je anon key in
```

### 3. Eerste admin aanmaken

1. Start de app: `npm run dev`
2. Ga naar http://localhost:3000/login -> **Registreren**
3. Open Supabase -> **Table Editor** -> `profiles`
4. Zet de `role` van je gebruiker op `admin`

Nu kun je via `/admin` documenten toevoegen en bewerken.

## Ontwikkelen

```bash
npm run dev      # lokaal draaien op http://localhost:3000
npm run build    # production build
npm run start    # production server
```

## Structuur

```
src/
  app/
    page.tsx              # Home: docs lijst + zoekbalk
    docs/[slug]/page.tsx  # Doc bekijken
    login/page.tsx        # Login / registratie
    admin/
      page.tsx            # Admin dashboard
      new/page.tsx        # Nieuwe doc
      edit/[id]/page.tsx  # Doc bewerken
      actions.ts          # Server actions (CRUD)
  components/
    DocEditor.tsx         # Markdown editor met preview
    SignOutButton.tsx
  lib/supabase/
    client.ts             # browser Supabase client
    server.ts             # server Supabase client
  proxy.ts                # auth-bescherming voor /admin
```

## Deploy naar Vercel

1. Push deze map naar GitHub
2. Op https://vercel.com -> **Add New Project** -> importeer de repo
3. Voeg de twee env vars toe in Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy - elke push update de site automatisch

## Rollen

- `admin` / `editor` - mag docs aanmaken, bewerken, verwijderen
- `viewer` (default) - alleen lezen

Rollen wijzig je in Supabase Table Editor -> `profiles` tabel.
