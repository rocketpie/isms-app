-- 005_app.sql — app schema, JWT helpers, auth.users mirror + sync

CREATE SCHEMA IF NOT EXISTS app;

-- JWT claim helpers for PostgREST
CREATE OR REPLACE FUNCTION app.jwt_claims() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION app.jwt_sub()   RETURNS uuid  LANGUAGE sql STABLE AS $$ SELECT (app.jwt_claims()->>'sub')::uuid $$;
CREATE OR REPLACE FUNCTION app.jwt_role()  RETURNS text  LANGUAGE sql STABLE AS $$ SELECT app.jwt_claims()->>'role' $$;
CREATE OR REPLACE FUNCTION app.jwt_email() RETURNS text  LANGUAGE sql STABLE AS $$ SELECT app.jwt_claims()->>'email' $$;

-- Mirror table for convenience (minimal fields; extend as needed)
CREATE TABLE IF NOT EXISTS app.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

-- Backfill from existing GoTrue users (if any)
INSERT INTO app.users (id, email, raw_user_meta_data, created_at, updated_at)
SELECT id, email, raw_user_meta_data, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Sync trigger: keep app.users mirrored with auth.users
CREATE OR REPLACE FUNCTION app.sync_user_from_auth() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    INSERT INTO app.users (id, email, raw_user_meta_data, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data, NEW.created_at, NEW.updated_at)
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          raw_user_meta_data = EXCLUDED.raw_user_meta_data,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM app.users WHERE id = OLD.id;
  END IF;
  RETURN NULL;
END$$;

CREATE TRIGGER trg_app_sync_user
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION app.sync_user_from_auth();
