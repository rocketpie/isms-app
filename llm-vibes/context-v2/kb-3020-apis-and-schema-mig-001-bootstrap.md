---
title: MIG-001 Bootstrap Roles & Schemas
tags: [sql, migration, roles, bootstrap, gotrue, postgrest]
relates_to: [mig-005-app, mig-010-isms, db-schema-overview]
---

# What it does
Initial bootstrap script for Supabase/Postgres environment.  
Defines runtime roles, PostgREST connection roles, Supabase GoTrue admin role, and schema hygiene.  
This migration runs *before* any app/isms migrations, so later SQL can assume these roles/schemas exist.

# Key actions
- **Runtime roles**: `anon`, `authenticated`  
- **App roles**: `editor`, `admin` (both inherit `authenticated`)  
- **Connection role**: `authenticator` (LOGIN, NOINHERIT), granted anon/authenticated/editor/admin  
- **GoTrue admin role**: `supabase_auth_admin` (LOGIN, NOINHERIT), owns `auth` schema  
- **Schemas**: creates `auth` (for GoTrue), locks down `public`  
- **Permissions**: 
  - `auth` schema: usage to anon/authenticated/editor, full usage+create to `supabase_auth_admin`  
  - `public` schema: revoked from all  

# Gotchas
- Requires environment variables: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `AUTHENTICATOR_PASSWORD`.  
- Must run before GoTrue container starts (otherwise auth schema missing).  
- `pgcrypto`/`pgjwt` extensions are commented here; enable later if JWT generation needed inside DB.  
- Locks down `public` fully—new objects must be explicitly created in `auth`, `app`, or `isms`.

# Related
- [MIG-005 App schema](mig-005-app.md) — uses these roles/schemas.  
- [PostgREST routes](../30-apis-and-schema/postgrest-routes.md).
