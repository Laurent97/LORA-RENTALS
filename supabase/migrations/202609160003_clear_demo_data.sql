-- Clear all demo data while keeping admin: kizzolaurent@gmail.com
-- Run this in the Supabase SQL editor.

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('users', 'country_settings')
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'supabase_%'
  LOOP
    BEGIN
      EXECUTE format('TRUNCATE public.%I CASCADE', t);
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables that cannot be truncated (e.g. system views)
      NULL;
    END;
  END LOOP;
END $$;

-- Keep the admin user
DELETE FROM public.users WHERE email <> 'kizzolaurent@gmail.com';
DELETE FROM auth.users WHERE email <> 'kizzolaurent@gmail.com';

COMMIT;
