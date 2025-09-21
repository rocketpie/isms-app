---
title: MIG-021 Admin Role Grant RPC
tags: [sql, migration, app, rpc, security-definer, gotrue, postgrest]
relates_to: [mig-005-app, mig-020-policies, postgrest-routes]
---

# What it does
Exposes an **admin-only RPC** in `app` to update a user's `raw_app_meta_data.role` in `auth.users`.  
Locks down `app` by default (tables & functions), then explicitly allows what PostgREST needs.

# Prereqs
- `PGRST_DB_SCHEMAS=isms,app`
- `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`
- JWT helpers from [MIG-005](mig-005-app.md).

# Key objects
- Grants: `USAGE` on `app` to `authenticator, authenticated, editor`.  
- Table perms: default revoke; **grant SELECT on `app.users`** to `authenticated`.  
- Function perms: default revoke; explicit grants only.  
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

# Related
- [MIG-005 App Schema](mig-005-app.md)  
- [MIG-020 ISMS RLS](mig-020-policies.md)
