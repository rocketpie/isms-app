-- 020_policies.sql

-- Visibility
GRANT USAGE ON SCHEMA isms TO authenticated, editor;

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'isms'
      AND tablename NOT IN ('audit_log')
  LOOP
    EXECUTE format('GRANT SELECT ON TABLE %I.%I TO authenticated;', t.schemaname, t.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I.%I TO editor;', t.schemaname, t.tablename);

    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', t.schemaname, t.tablename);

    -- All authenticated can read
    EXECUTE format($p$
      DROP POLICY IF EXISTS %I_read_all ON %I.%I;
      CREATE POLICY %I_read_all ON %I.%I
      FOR SELECT TO authenticated USING (true);
    $p$, t.tablename, t.schemaname, t.tablename, t.tablename, t.schemaname, t.tablename);

    -- Editors can do everything
    EXECUTE format($p$
      DROP POLICY IF EXISTS %I_editor_all ON %I.%I;
      CREATE POLICY %I_editor_all ON %I.%I
      FOR ALL TO editor USING (true) WITH CHECK (true);
    $p$, t.tablename, t.schemaname, t.tablename, t.tablename, t.schemaname, t.tablename);
  END LOOP;
END $$;

-- Keep audit_log private (no policies -> only service/superuser can read)
ALTER TABLE isms.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_any ON isms.audit_log;
