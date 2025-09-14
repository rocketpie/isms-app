-- 020_policies.sql — ISMS only (no audit dependency)

-- Base grants on schema & existing tables
GRANT USAGE ON SCHEMA isms TO authenticated, editor;
GRANT SELECT ON ALL TABLES IN SCHEMA isms TO authenticated;
GRANT ALL    ON ALL TABLES IN SCHEMA isms TO editor;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA isms TO editor;

-- Enable RLS on every base table in isms
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'isms' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.table_schema, r.table_name);
  END LOOP;
END$$;

-- Create policies per table, idempotently (no DROP; suppress duplicates)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'isms' AND table_type = 'BASE TABLE'
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I_read_all ON %I.%I FOR SELECT TO authenticated USING (true);',
        r.table_name, r.table_schema, r.table_name
      );
    EXCEPTION WHEN duplicate_object THEN
      -- policy already exists; ignore
      NULL;
    END;

    BEGIN
      EXECUTE format(
        'CREATE POLICY %I_editor_all ON %I.%I FOR ALL TO editor USING (true) WITH CHECK (true);',
        r.table_name, r.table_schema, r.table_name
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END$$;
