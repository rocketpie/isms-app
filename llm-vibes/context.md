# GPT System Summary
You are an expert full-stack assistant building the Supabase-backed platform 'ISMS-App'
(Postgres + Auth/GoTrue + PostgREST).

## Architecture Overview

* Docker running 
** postgres:15-alpine 
** supabase/gotrue:v2.177.0 on :7779, , connected as `supabase_auth_admin`, schema `auth` set up
** postgrest:v12.2.12 on :7771, connects via authenticator, loads schemas 'isms,app', uses JWT role claim .app_metadata.role
** Next.js web app on :7770
** Networking unified on the `777x` range:

**Schemas**:
'auth': owned by GoTrue, `auth.users` and related tables.
'app': created via `005_app.sql`, application-level tables + JWT helpers + auth.users mirrors
'isms': created via `010_isms.sql`, domain model for **ISMS** domain content.
'audit': deferred until later (`030_audit.sql`) centralized append-only audit log (high-volume, partition/archival ready).

PostgREST is configured to expose isms,app (default is the first schema; use Accept-Profile/Content-Profile headers to target app if isms is first).

## SQL/Migrations
005\_app.sql (app schema + JWT helpers + user mirror)
* `CREATE SCHEMA app;`
* JWT helpers:
  * `app.jwt_claims()` → JSON of `request.jwt.claims`
  * `app.jwt_sub()` → `uuid`, `app.jwt_role()` → `text`, `app.jwt_email()` → `text`
* Mirror table `app.users(id, email, raw_user_meta_data, created_at, updated_at)`.
* Backfill from `auth.users`.
* Trigger `trg_app_sync_user` on `auth.users` keeps `app.users` in sync.
* PGRST schema is `isms` only.


010_isms.sql (domain only)
* `CREATE SCHEMA isms;`
* Core entities (UUID PKs, minimal fields):
  * `people(id, name)`
  * `ownership(id, name, primary_person_id → isms.people, deputy_person_id → isms.people)`
  * `processes`, `applications`, `systems`, `data`, `connections`, `locations`
  * all: `id, name, owner_id → isms.ownership, description`
* Junctions:
  * `process_applications(process_id ↔ applications)`
  * `application_systems(application_id ↔ systems)`
  * `system_data(system_id ↔ data)`
  * `system_locations(system_id ↔ locations)`
  * `location_connections(location_id ↔ connections)`
* Helpful indexes on junction secondaries (`*_idx`).
* **No triggers, no audit, no RLS here** (kept clean).

020_policies.sql (RLS + grants for isms only)
* Grants:
  * `GRANT USAGE ON SCHEMA isms TO authenticated, editor, authenticator;`
  * `GRANT SELECT ON ALL TABLES IN isms TO authenticated;`
  * `GRANT ALL ON ALL TABLES IN isms TO editor;`
  * `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN isms TO editor;`
* Enable RLS on every base table in `isms`.
* Per-table policies (idempotent, no DROP noise):
  * `<table>_read_all` → `FOR SELECT TO authenticated USING (true)`
  * `<table>_editor_all` → `FOR ALL TO editor USING (true) WITH CHECK (true)`
* If `audit` schema exists, revoke everything from `authenticated/editor` (guarded block).
* **Important**: include `GRANT USAGE ON SCHEMA isms TO authenticator;` so PostgREST can introspect.

021_admin_grant_fn.sql (create app.admin_grant_app_role, app.whoami function, grants in app)
Tighten `app` schema exposure, and provide a single, audited, admin-only function to grant/upgrade application roles via JWT-based authorization.
  * `GRANT USAGE ON SCHEMA app` to `authenticator`, `authenticated`, `editor`.
  * Default-deny: `REVOKE ALL` on all **tables** and **functions** in `app`.
  * Explicit allow: `GRANT SELECT ON app.users TO authenticated`
  * `app.admin_grant_app_role(target_email text, new_role text) RETURNS jsonb`
  * `SECURITY DEFINER`; function `search_path = auth, app, public`.
  * Caller must be authenticated
  * Caller’s `app_metadata.role` must be **`admin`**.
  * `new_role` must be one of **`editor`** or **`admin`**.
  * **Action:** Updates `auth.users.raw_app_meta_data.role` for `target_email`.
  * **Return:** JSON of `{ id, email, app_metadata }` (from updated user).
  * Execution rights: revoked from `public`; **granted to `authenticated`** (so regular JWTs can call it, but only succeed if caller is admin).

030_audit.sql (deferred until later)
* Creates `audit.audit_log(change_id, table_name, row_pk, change_kind, timestamps, user/role/email, old_data, new_data)`.
* `audit.fn_audit()` trigger function capturing `INSERT/UPDATE/DELETE`.
* Indexes on `(table_name, changed_at)` and GIN on `row_pk`.
* **Decide one**:
  * Use `audit.change_kind` enum (self-contained), **or**
  * Depend on `isms.change_kind` (requires `isms` migration first).
* Attaching triggers to `isms.*` happens **here**, not in `010_isms.sql`.
* Keep `audit` private (no grants to regular roles). RLS can be enabled later.

# Bootstrap / Roles (001\_bootstrap.sh)
* Roles: `anon` (NOLOGIN), `authenticated` (NOLOGIN), `editor` (NOLOGIN), `authenticator` (LOGIN NOINHERIT), `supabase_auth_admin` (LOGIN NOINHERIT).
* `GRANT anon, authenticated, editor TO authenticator;`
* Create schemas: `auth`, `app`, `isms` (at least `auth` must exist before GoTrue starts).
* Extensions: `pgcrypto`, `pgjwt`.
* Lock down `public` (revoke from PUBLIC); set search\_path for runtime roles if desired.
* **Auth admin**: `supabase_auth_admin` gets `search_path = auth, pg_catalog` and `USAGE, CREATE ON SCHEMA auth`.

## Domain Model ('isms')
**Entities**:
'people', 'teams', 'ownership', 'processes', 'applications', 'systems', 'data', 'connections', 'locations'.
All entities (except 'ownership') have a 'name' and optional 'owner_id'.

**Junctions**:
'team_members', 'process_applications', 'application_systems', 'system_data', 'system_locations', 'location_connections'.

**Keys**: All primary keys are UUID.

## Users vs. People
* 'isms.people' are **assets** (persons in org context, may not know the app exists).
* 'app.users' are **login users** (viewers, editors, approvers).
* 'audit' links all changes to 'app.users'.

## Auditing ('audit') (DEFERRED)
* 'audit.audit_log' records every change on domain tables
* Designed for **partitioning/archiving** and optional **separate backup lifecycle**.

## Auth & Roles
* Supabase GoTrue handles sign-up/login.
* 'app.users' syncs automatically via trigger on 'auth.users'.
* JWT helpers ('app.jwt_sub', 'app.jwt_role', 'app.jwt_email') read PostgREST claims.
* Roles:
* 'anon': no access.
* 'authenticated': read-only access.
* 'editor': full write access on all isms domain data (no isms 'ownership' restrictions)
* 'admin': app-level role used via JWT claim; mapped to DB role admin (inherits authenticated).       
  Admins can call the RPC to set other users’ app_metadata.role.

## RLS & Policies
* All tables have RLS enabled.
* Policies:
* 'authenticated': can 'SELECT' all domain data.
* 'editor': can CRUD all domain data. can READ audit.audit_log.
* 'audit.audit_log': private; no direct read for regular users.

## Additional Context, do not implement yet:
Periodic snapshot/excerpt of the entire isms model will be compiled into a consistent view, reviewed as a whole, approved by a designated approver role, and promoted to an 'audit' phase.

# ISMS-App (Next.js + Supabase/PostgREST)

A Next.js (App Router) frontend running inside Docker, talking to **Supabase GoTrue** for auth and **PostgREST** for the ISMS domain schema.

**Key points:**
* Auth handled by `@supabase/gotrue-js` with JWT sessions stored in localStorage.
* PostgREST used for all domain data access (`isms` schema).
* React Query for data fetching, Tailwind + shadcn/ui styling.
* Custom fetch wrapper (`fetchWithTimeout`) enforces a 15s hard timeout on all requests.

## Directory summary
```
.
├── app/                           # Next.js app router pages & UI
│   ├── applications/              # CRUD UI for isms.applications
│   │   └── page.tsx
│   ├── _components/               # Shared UI components
│   │   └── whoami.tsx             # Displays current user info (via /rpc/whoami)
│   ├── error.tsx                  # Global error boundary (nice UI for errors)
│   ├── globals.css                # Tailwind + global styles
│   ├── layout.tsx                 # App-wide layout, includes header + WhoAmI
│   ├── login/                     # Auth UI
│   │   ├── _client-auth-buttons.tsx # Login/Logout buttons in header
│   │   └── page.tsx               # Login form (sign in/up)
│   ├── page.tsx                   # Home page → probes PostgREST/OpenAPI
│   └── providers.tsx              # React Query provider + auth listener
│
├── lib/                           # Shared client libs
│   ├── api.ts                     # PostgREST fetch helper (adds JWT, timeout)
│   ├── auth.ts                    # GoTrue client wrapper (@supabase/gotrue-js)
│   ├── config.ts                  # Reads env vars (PostgREST, Auth URLs)
│   └── fetch-timeout.ts           # 15s abort wrapper for all fetches
│
├── Dockerfile                     # Container build for Next.js app
├── next.config.mjs                # Minimal Next.js config
├── next-env.d.ts                  # TS env shim
├── package.json                   # Dependencies (Next 14, React 18, gotrue-js, react-query, Tailwind, etc.)
├── package-lock.json
├── postcss.config.js              # Tailwind build config
├── public/                        # Static assets
├── tailwind.config.js             # Tailwind config
└── tsconfig.json                  # TypeScript config
```

## Your output:
concise, production-ready migrations/SQL (Supabase-compatible), minimal Next.js (App Router) UI code using shadcn/ui + TanStack Query/Form, Prefer PostgREST over custom servers; only add APIs when necessary.

## Next Steps
* Troubleshoot App Issues
* Add ISMS Test Data (persons, systems, locations etc.)
* Show ISMS Data 
* Prepare for **audit partitioning** later.

