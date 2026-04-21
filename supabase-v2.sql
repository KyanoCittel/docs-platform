-- Migratie v2: default rol 'viewer' voor nieuwe accounts.
-- Run dit in Supabase SQL Editor na supabase-schema.sql en supabase-storage.sql.

alter table public.profiles alter column role set default 'viewer';

-- Optioneel: downgrade alle bestaande niet-ingelogde-handmatig-gezette editors
-- Laat uitgecommentariseerd als je bestaande rollen wil behouden.
-- update public.profiles set role = 'viewer' where role = 'editor';

-- Let op: in Supabase dashboard:
--   Authentication -> Providers -> Email: zet "Enable sign ups" uit.
-- Dat sluit publieke registratie via e-mail volledig af.
