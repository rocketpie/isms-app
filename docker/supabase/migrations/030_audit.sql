-- 007_audit.sql
CREATE SCHEMA IF NOT EXISTS audit;

-- change_kind stays in isms (domain) or move here if you prefer; keeping in isms is fine.
-- If you want it in audit, uncomment:
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
--                  WHERE t.typname='change_kind' AND n.nspname='audit') THEN
--     CREATE TYPE audit.change_kind AS ENUM ('create','update','delete');
--   END IF;
-- END $$;

-- Use the existing isms.change_kind enum:
-- (If you moved it to audit, replace references below accordingly.)

CREATE TABLE IF NOT EXISTS audit.audit_log (
  change_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  row_pk jsonb NOT NULL,                   -- {"id":"..."} or composite key
  change_kind isms.change_kind NOT NULL,   -- or audit.change_kind
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_user_id uuid NULL REFERENCES app.users(id),
  changed_by_role text,
  changed_by_email text,
  txid bigint NOT NULL DEFAULT txid_current(),
  old_data jsonb,
  new_data jsonb
);

-- Indexes geared for common queries; partition-ready later
CREATE INDEX IF NOT EXISTS audit_log_table_time_idx ON audit.audit_log (table_name, changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_rowpk_gin      ON audit.audit_log USING GIN (row_pk);

-- Central audit trigger function (called from isms tables)
CREATE OR REPLACE FUNCTION audit.fn_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user  uuid := app.jwt_sub();
  v_role  text := app.jwt_role();
  v_email text := app.jwt_email();
  v_pk jsonb; v_old jsonb; v_new jsonb;
  v_tbl text := tg_table_schema || '.' || tg_table_name;
  k1 text; v1 text; k2 text; v2 text;
BEGIN
  IF tg_op = 'INSERT' THEN
    v_new := to_jsonb(NEW);
  ELSIF tg_op = 'UPDATE' THEN
    v_new := to_jsonb(NEW); v_old := to_jsonb(OLD);
  ELSE
    v_old := to_jsonb(OLD);
  END IF;

  IF tg_nargs = 0 OR tg_argv[0] = 'id' THEN
    v_pk := jsonb_build_object('id', COALESCE((to_jsonb(COALESCE(NEW,OLD))->>'id'),''));
  ELSE
    k1 := tg_argv[0]; k2 := CASE WHEN tg_nargs > 1 THEN tg_argv[1] END;
    v1 := to_jsonb(COALESCE(NEW,OLD))->>k1;
    v_pk := jsonb_build_object(k1, COALESCE(v1,''));
    IF k2 IS NOT NULL THEN
      v2 := to_jsonb(COALESCE(NEW,OLD))->>k2;
      v_pk := v_pk || jsonb_build_object(k2, COALESCE(v2,''));
    END IF;
  END IF;

  INSERT INTO audit.audit_log(
    table_name, row_pk, change_kind, changed_at,
    changed_by_user_id, changed_by_role, changed_by_email,
    txid, old_data, new_data
  )
  VALUES (
    v_tbl, v_pk,
    CASE tg_op WHEN 'INSERT' THEN 'create'::isms.change_kind
               WHEN 'UPDATE' THEN 'update'::isms.change_kind
               ELSE 'delete'::isms.change_kind END,
    now(),
    v_user, v_role, v_email,
    txid_current(), v_old, v_new
  );

  RETURN CASE WHEN tg_op IN ('INSERT','UPDATE') THEN NEW ELSE OLD END;
END $$;

-- Keep audit private for now
GRANT USAGE ON SCHEMA audit TO postgres;
REVOKE ALL ON SCHEMA audit FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA audit FROM PUBLIC;

-- (Optional) RLS for audit table: enable later when you add read roles/views
ALTER TABLE audit.audit_log ENABLE ROW LEVEL SECURITY;
-- No policies = service/superuser only.
