---
title: Stack Compose Services
tags: [architecture, docker, compose, supabase, postgrest]
relates_to: [local-dev, migrations-startup, smoke-tests, mig-005-app, mig-020-policies]
---

# What it defines
Four services wired for local dev:

- **db (postgres:15-alpine)**  
  - Init via `./supabase/init` (runs 001_bootstrap).  
  - Exposes `5432`, volume `db_data`.  
  - Healthcheck: `pg_isready`.

- **auth (supabase/gotrue:v2.177.0)**  
  - DSN as `supabase_auth_admin@db` to schema `auth`.  
  - Ports: `${AUTH_PORT}:${API_PORT}` (defaults to `7779`).  
  - Autoconfirm & email toggled via env.  
  - JWT: `GOTRUE_JWT_SECRET`, aud `authenticated`.

- **postgrest (v12.2.12)**  
  - Connects as `authenticator`.  
  - Schemas: `isms,app`; anon role `${PGRST_DB_ANON_ROLE}`.  
  - **Critical**: `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`.  
  - OpenAPI proxy URI: `http://${BASE_HOST}:${API_PORT}`.  
  - Ports: `${API_PORT}:3000`.

- **web (Next.js)**  
  - Builds from `./web`, waits on `postgrest, auth`.  
  - Ports: `${WEB_PORT}:3000`.

# Gotchas
- Keep **env vars** in `.env` (secrets: `JWT_SECRET`, `AUTHENTICATOR_PASSWORD`).  
- Healthchecks gate startup order; migrations run after `db` is healthy.  
- OpenAPI root should resolve at `http://${BASE_HOST}:${API_PORT}/`.  
- Volume name `db_data` must match `reset.sh` if you customize it.

# Related
- Scripts: `start.sh`, `test.sh`, `reset.sh`.  
- Migrations: [MIG-005](../30-apis-and-schema/mig-005-app.md), [MIG-020](../30-apis-and-schema/mig-020-policies.md).
```
