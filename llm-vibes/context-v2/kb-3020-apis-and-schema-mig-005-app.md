---
title: MIG-005 App Schema & JWT Helpers
tags: [sql, migration, schema, jwt, users, gotrue]
relates_to: [mig-001-bootstrap, mig-021-admin-grant-fn, db-schema-overview, postgrest-routes]
---

# What it does
Sets up the `app` schema to bridge between **GoTrue auth** (`auth.users`) and **PostgREST/JWT claims**.  
Adds helper functions for claim extraction, a mirrored `app.users` table, and a sync trigger to keep it consistent.

# Key objects
- **Schema**: `app`
- **Functions**:  
  - `app.jwt_claims()` — returns full JWT claims JSON  
  - `app.jwt_sub()` → UUID from `sub`  
  - `app.jwt_role()` → text from `role`  
  - `app.jwt_email()` → text from `email`
- **Table**: `app.users(id, email, raw_user_meta_data, created_at, updated_at)`
- **Trigger**: `trg_app_sync_user` keeps `app.users` in sync with `auth.users`

# Gotchas
- **Backfill** step pulls existing users into `app.users`; safe to re-run (`ON CONFLICT DO NOTHING`).  
- Trigger function uses `SECURITY DEFINER` — ensure owner has correct permissions.  
- JWT helpers depend on PostgREST setting `request.jwt.claims`. Without PostgREST, they return `{}`.  
- `app.users` is minimal: add columns if you need richer user metadata.  

# Related
- [MIG-001 Bootstrap](mig-001-bootstrap.md) — defines roles/schemas.  
- [MIG-021 Admin Grant Function](mig-021-admin-grant-fn.md) — upgrades `app.users` roles.  
- [PostgREST Routes](postgrest-routes.md).
