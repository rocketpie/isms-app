-- 021_admin_grant_fn.sql (updated)
-- Keep user logic in `app` and expose it directly (we now allow PostgREST to load
-- both schemas via PGRST_DB_SCHEMAS=isms,app). No wrapper in `isms` needed.
--
-- Prereqs:
--   - PGRST_JWT_ROLE_CLAIM_KEY = .app_metadata.role
--   - PostgREST env: PGRST_DB_SCHEMAS=isms,app
--   - 005_app.sql created jwt helpers
--
-- Security model:
--   - SECURITY DEFINER function in `app` updates auth.users after verifying the
--     caller has app_metadata.role = 'admin'.
--   - We grant EXECUTE to `authenticated` so a normal JWT can call it.

set local search_path = public;

-------------------------------------------------------------------------------
-- Hardening: limit what PostgREST can do in `app`
-------------------------------------------------------------------------------
-- Allow introspection
GRANT USAGE ON SCHEMA app TO authenticator, authenticated, editor;

-- Lock down tables by default (adjust as needed)
REVOKE ALL ON ALL TABLES IN SCHEMA app FROM PUBLIC;
-- Read-only mirror of users is OK to expose if you want it; otherwise comment out:
-- grant select on table app.users to authenticated;

-- Lock down functions by default and then grant explicitly
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;

GRANT SELECT ON app.users TO authenticated;

-------------------------------------------------------------------------------
-- Core function in `app`
-------------------------------------------------------------------------------
create or replace function app.admin_grant_app_role(target_email text, new_role text)
returns jsonb
language plpgsql
security definer
set search_path = auth, app, public
as $$
declare
  caller_email text := app.jwt_email();
  caller_role  text := (app.jwt_claims() -> 'app_metadata' ->> 'role');
  allowed_roles text[] := array['editor','admin'];
  updated jsonb;
begin
  if caller_email is null then
    raise exception 'unauthenticated';
  end if;

  if caller_role is distinct from 'admin' then
    raise exception 'forbidden: caller is not admin';
  end if;

  if new_role is null or new_role = '' or not (new_role = any(allowed_roles)) then
    raise exception 'invalid role %', new_role;
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', new_role)
   where email = target_email
   returning to_jsonb(auth.users.*) into updated;

  if not found then
    raise exception 'user % not found', target_email;
  end if;

  return jsonb_build_object(
    'id', (updated->>'id')::uuid,
    'email', target_email,
    'app_metadata', (updated->'raw_app_meta_data')
  );
end;$$;

revoke all on function app.admin_grant_app_role(text, text) from public;
GRANT EXECUTE ON FUNCTION app.admin_grant_app_role(text, text) TO authenticated;

-------------------------------------------------------------------------------
-- Optional debug: whoami view (now in `app` since schema is exposed)
-------------------------------------------------------------------------------
create or replace view app.whoami as
select
  app.jwt_email() as email,
  (app.jwt_claims() -> 'app_metadata' ->> 'role') as app_role,
  app.jwt_claims() as claims;

grant select on app.whoami to authenticated;
