--- 
title: Schema Migrations – Bootstrap & App 
tags: [database, schema, migrations, bootstrap, app] 
related: [kb-3010-schema-overview, kb-3030-schema-isms, kb-3099-schema-audit] 
--- 
 
# MIG-001 Bootstrap 
Defines runtime roles, PostgREST connection roles, Supabase GoTrue admin role, and schema hygiene. 
This migration runs *before* any app/isms migrations, so later SQL can assume these roles/schemas exist. 
 
## Key actions 
- Runtime roles: `anon`, `authenticated` 
- App roles: `editor`, `admin` (both inherit `authenticated`) 
- Connection role: `authenticator` (LOGIN, NOINHERIT), granted anon/authenticated/editor/admin 
- GoTrue admin role: `supabase_auth_admin` (LOGIN, NOINHERIT), owns `auth` schema 
- Schemas: creates `auth` (for GoTrue), locks down `public` 
- Permissions: 
  - `auth` schema: usage to anon/authenticated/editor, full usage+create to `supabase_auth_admin` 
  - `public` schema: revoked from all 
 
## Gotchas 
- Requires environment variables: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `AUTHENTICATOR_PASSWORD`. 
- `pgcrypto`/`pgjwt` extensions are commented here; enable later if JWT generation needed inside DB. 
- Locks down `public` fully—new objects must be explicitly created in `auth`, `app`, or `isms`. 
 
 
--- 
# MIG-005 App Schema Migration 
Sets up the `app` schema to bridge between **GoTrue auth** (`auth.users`) and **PostgREST/JWT claims**. 
Adds helper functions for claim extraction, a mirrored `app.users` table, and a sync trigger to keep it consistent. 
 
## Key objects 
- Schema: `app` 
- Functions: 
  - `app.jwt_claims()` — returns full JWT claims JSON 
  - `app.jwt_sub()` → UUID from `sub` 
  - `app.jwt_role()` → text from `role` 
  - `app.jwt_email()` → text from `email` 
- Table: `app.users(id, email, raw_user_meta_data, created_at, updated_at)` 
- Trigger: `trg_app_sync_user` keeps `app.users` in sync with `auth.users` 
 
## Gotchas 
- **Backfill** step pulls existing users into `app.users`; safe to re-run (`ON CONFLICT DO NOTHING`). 
- Trigger function uses `SECURITY DEFINER` — ensure owner has correct permissions. 
- JWT helpers depend on PostgREST setting `request.jwt.claims`. Without PostgREST, they return `{}`. 
- `app.users` is minimal: add columns if you need richer user metadata. 
 
 
--- 
# MIG-021 Admin Role Grant RPC 
Exposes an **admin-only RPC** in `app` to update a user's `raw_app_meta_data.role` in `auth.users`. 
Locks down `app` by default (tables & functions), then explicitly allows what PostgREST needs. 
 
# Prereqs 
- `PGRST_DB_SCHEMAS=isms,app` 
- `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role` 
- JWT helpers from [MIG-005 APP]. 
 
# Key objects 
- GRANT USAGE on `app` to `authenticator, authenticated, editor`. 
- GRANT SELECT on `app.users` to `authenticated`. 
- RPC: `app.admin_grant_app_role(target_email text, new_role text)` 
  - `SECURITY DEFINER`, `search_path = auth, app, public` 
  - Validates caller is authenticated **and** `app_metadata.role = 'admin'` 
  - Accepts `editor|admin`; updates `auth.users.raw_app_meta_data.role` 
  - Returns `{ id, email, app_metadata }` 
  - `GRANT EXECUTE TO authenticated` 
- Utility: `app.whoami()` (SECURITY DEFINER) for debugging claims. 
 
# Gotchas 
- Requires `pgjwt`/PostgREST to set `request.jwt.claims`; otherwise `whoami()`/checks fail. 
- If you don’t want `app.users` readable, drop the SELECT grant (but keep for UI/admin screens). 
- Ensure the function owner is a superuser or has rights on `auth.users`. 
- Errors: raises `unauthenticated`, `forbidden`, `invalid role`, or `user not found`. 
 