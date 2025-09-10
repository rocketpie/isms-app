-- 010_isms.sql
CREATE SCHEMA IF NOT EXISTS isms;

-- Entities (assets)
CREATE TABLE IF NOT EXISTS isms.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS isms.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL
);

-- Optional membership (asset-level, not auth)
CREATE TABLE IF NOT EXISTS isms.team_members (
  team_id uuid NOT NULL REFERENCES isms.teams(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES isms.people(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, person_id)
);

-- Ownership (generic)
CREATE TABLE IF NOT EXISTS isms.ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type varchar(50) NOT NULL CHECK (owner_type IN ('person','team')),
  owner_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS isms.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

CREATE TABLE IF NOT EXISTS isms.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

CREATE TABLE IF NOT EXISTS isms.systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

CREATE TABLE IF NOT EXISTS isms.data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

CREATE TABLE IF NOT EXISTS isms.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

CREATE TABLE IF NOT EXISTS isms.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership(id)
);

-- Junctions
CREATE TABLE IF NOT EXISTS isms.process_applications (
  process_id uuid REFERENCES isms.processes(id) ON DELETE CASCADE,
  application_id uuid REFERENCES isms.applications(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, application_id)
);

CREATE TABLE IF NOT EXISTS isms.application_systems (
  application_id uuid REFERENCES isms.applications(id) ON DELETE CASCADE,
  system_id uuid REFERENCES isms.systems(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, system_id)
);

CREATE TABLE IF NOT EXISTS isms.system_data (
  system_id uuid REFERENCES isms.systems(id) ON DELETE CASCADE,
  data_id uuid REFERENCES isms.data(id) ON DELETE CASCADE,
  PRIMARY KEY (system_id, data_id)
);

CREATE TABLE IF NOT EXISTS isms.system_locations (
  system_id uuid REFERENCES isms.systems(id) ON DELETE CASCADE,
  location_id uuid REFERENCES isms.locations(id) ON DELETE CASCADE,
  PRIMARY KEY (system_id, location_id)
);

CREATE TABLE IF NOT EXISTS isms.location_connections (
  location_id uuid REFERENCES isms.locations(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES isms.connections(id) ON DELETE CASCADE,
  PRIMARY KEY (location_id, connection_id)
);

-- ===== Auditing (app users, not asset people) =====
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE t.typname='change_kind' AND n.nspname='isms'
  ) THEN
    CREATE TYPE isms.change_kind AS ENUM ('create','update','delete');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS isms.audit_log (
  change_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  row_pk jsonb NOT NULL,
  change_kind isms.change_kind NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_user_id uuid NULL REFERENCES app.users(id),
  changed_by_role text,
  changed_by_email text,
  txid bigint NOT NULL DEFAULT txid_current(),
  old_data jsonb,
  new_data jsonb
);
CREATE INDEX IF NOT EXISTS audit_log_table_time_idx ON isms.audit_log (table_name, changed_at);
CREATE INDEX IF NOT EXISTS audit_log_rowpk_gin     ON isms.audit_log USING gin (row_pk);

-- Generic audit trigger (calls app.jwt_* defined in 005_app.sql)
CREATE OR REPLACE FUNCTION isms.fn_audit() RETURNS trigger
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

  INSERT INTO isms.audit_log(
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

-- Attach audit triggers
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'isms.'||tbl AS fq, pkcols FROM
    ( VALUES
      ('people','id'), ('teams','id'), ('ownership','id'),
      ('processes','id'), ('applications','id'), ('systems','id'),
      ('data','id'), ('connections','id'), ('locations','id'),
      ('team_members','team_id,person_id'),
      ('process_applications','process_id,application_id'),
      ('application_systems','application_id,system_id'),
      ('system_data','system_id,data_id'),
      ('system_locations','system_id,location_id'),
      ('location_connections','location_id,connection_id')
    ) AS t(tbl, pkcols)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON %s', r.fq);
    IF r.pkcols LIKE '%,%' THEN
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON %s
         FOR EACH ROW EXECUTE FUNCTION isms.fn_audit(%s);',
        r.fq,
        (SELECT string_agg(quote_literal(trim(x)), ',')
         FROM regexp_split_to_table(r.pkcols, ',') x)
      );
    ELSE
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON %s
         FOR EACH ROW EXECUTE FUNCTION isms.fn_audit(''id'');',
        r.fq
      );
    END IF;
  END LOOP;
END $$;
