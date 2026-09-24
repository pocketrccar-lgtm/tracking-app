-- v3 · Step A — enable Row Level Security on every public table (2026-09-24, db-council C2).
-- The app connects as 'postgres' (rolbypassrls=true), so it is unaffected; this closes the
-- anon/authenticated full-write exposure through Supabase's Data API.
SET lock_timeout = '2s';
BEGIN;
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
COMMIT;
