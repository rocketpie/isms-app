--- 
title: Database Schema Overview 
tags: [database, schema, postgres, overview, migrations] 
related: [kb-1010-architecture-overview, kb-3020-schema-bootstrap-and-app, kb-3030-schema-isms] 
--- 
 
# DB Schemas 
- `auth` — owned by GoTrue (`auth.users`, etc). Not exposed directly except via triggers/mirrors. 
- `app` — JWT helpers + mirror of `auth.users`. Also contains admin RPCs (role grants, whoami). 
- `isms` — core domain entities (people, ownership, processes, applications, systems, data, connections, locations + junctions). Clean schema: no triggers or RLS here. 
- `audit` — append-only audit log + trigger function. Private; not yet active in dev stack. 
 
# Roles 
- `anon` — no access by default. 
- `authenticated` — read-only access to `isms`; SELECT on `app.users`. 
- `editor` — inherits `authenticated`; full CRUD access on `isms`. 
- `admin` — inherits `authenticated`; app-level user admin; can call RPCs to grant roles. 
- `authenticator` — PostgREST connection role; maps to anon/authenticated/editor/admin via JWT. 
- `supabase_auth_admin` — GoTrue DB role; owns `auth`. 
 
# Permissions 
- Default REVOKE ALL; explicit grants based on roles. 
 
# Data Flow 
- Users sign up/login via GoTrue → `auth.users`. 
- `app.users` mirror is kept in sync via trigger. 
- JWTs carry `app_metadata.role`; this **app_role** is the canonical application role (editor, admin). 
- PostgREST maps the same claim to a DB role (PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role) for RLS. 
- UIs and RPCs should read app_role from JWT claims for consistent behavior. 
- RLS (enabled in MIG-020) enforces read-only vs. editor. 