---
title: DB Schema Overview
tags: [schema, overview, postgres, supabase, postgrest]
relates_to: [mig-001-bootstrap, mig-005-app, mig-010-isms, mig-020-policies, mig-021-admin-grant-fn]
---

# Schemas
- **auth** — owned by GoTrue (`auth.users`, etc). Not exposed directly except via triggers/mirrors.  
- **app** — JWT helpers + mirror of `auth.users`. Also contains admin RPCs (role grants, whoami).  
- **isms** — core domain entities (people, ownership, processes, applications, systems, data, connections, locations + junctions). Clean schema: no triggers or RLS here.  
- **audit** — append-only audit log + trigger function. Private; not yet active in dev stack.

# Roles
- `anon` — no access by default.  
- `authenticated` — read-only access to `isms`; SELECT on `app.users`.  
- `editor` — full write access on `isms`.  
- `admin` — app-level; can call RPCs to grant roles.  
- `authenticator` — PostgREST connection role; maps to anon/authenticated/editor/admin via JWT.  
- `supabase_auth_admin` — GoTrue DB role; owns `auth`.

# Data Flow
- Users sign up/login via GoTrue → `auth.users`.  
- `app.users` mirror is kept in sync via trigger.  
- JWTs carry `app_metadata.role`; PostgREST maps claim → DB role.  
- RLS (enabled in MIG-020) enforces read-only vs. editor.

# Related
- [MIG-005 App Schema](mig-005-app.md)  
- [MIG-010 ISMS Domain](mig-010-isms.md)  
- [MIG-020 RLS & Grants](mig-020-policies.md)
