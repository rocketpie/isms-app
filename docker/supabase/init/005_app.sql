-- 005_app.sql
-- App schema keeps “application users” separate from ISMS assets.
CREATE SCHEMA IF NOT EXISTS app;

-- Real app users (mirror of auth.users; NOT isms.people)
CREATE TABLE IF NOT EXISTS app.users (
  id uuid PRIMARY KEY,          -- equals auth.users.id (JWT sub)
  email text UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mirror auth.users -> app.users on signup
CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO app.users(id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = EXCLUDED.display_name;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS app_on_auth_user_created ON auth.users;
CREATE TRIGGER app_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION app.handle_new_auth_user();

-- JWT helpers (PostgREST injects request.jwt.claims; we read them here)
CREATE OR REPLACE FUNCTION app.jwt_claims() RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::jsonb;
EXCEPTION WHEN others THEN
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION app.jwt_sub() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
DECLARE c jsonb := app.jwt_claims();
BEGIN
  IF c IS NULL THEN RETURN NULL; END IF;
  RETURN NULLIF(c->>'sub','')::uuid;
END $$;

CREATE OR REPLACE FUNCTION app.jwt_role() RETURNS text
LANGUAGE plpgsql STABLE AS $$
DECLARE c jsonb := app.jwt_claims();
BEGIN
  IF c IS NULL THEN RETURN NULL; END IF;
  RETURN NULLIF(c->>'role','');
END $$;

CREATE OR REPLACE FUNCTION app.jwt_email() RETURNS text
LANGUAGE plpgsql STABLE AS $$
DECLARE c jsonb := app.jwt_claims();
BEGIN
  IF c IS NULL THEN RETURN NULL; END IF;
  RETURN NULLIF(c->>'email','');
END $$;

-- Visibility (app data to logged-in users)
GRANT USAGE ON SCHEMA app TO authenticated, editor;
GRANT SELECT ON app.users TO authenticated, editor;
