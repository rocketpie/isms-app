--- 
title: Architecture & Data Flows 
tags: [architecture, components, data-flow, supabase, postgres, postgrest, gotrue, nextjs, docker] 
related: [kb-0000-index-overview, kb-3010-schema-overview, kb-2010-operations-environment-and-scripts] 
--- 
 
# Overview 
ISMS-App is a docker-backed web app built with Supabase like Postgres, PostgREST, GoTrue, and a Next.js web frontend. 
All services run in containers, orchestrated with a single docker-compose file 
 
# Components 
 
## Postgres (db) 
- Database, schema host for `auth`, `app`, `isms`. 
- Init via `./supabase/init` (001_bootstrap) 
- migrations via docker script start.sh 
- Exposes port `5432`, persistent volume `db_data`. 
- Healthcheck: `pg_isready`. 
 
## GoTrue (auth) 
- Manages sign-up, login, and password reset flows. 
- DSN: `supabase_auth_admin@db` → `auth` schema. 
- Ports: `${AUTH_PORT}:${API_PORT}` (default 7779). 
- JWT: `GOTRUE_JWT_SECRET`, aud `authenticated`. 
- Autoconfirm & email toggled via env. 
 
## PostgREST (api) 
- Connects as `authenticator`. 
- Schemas: `isms,app`; anon role `${PGRST_DB_ANON_ROLE}`. 
- Critical: `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`. 
- OpenAPI spec at `http://${BASE_HOST}:${API_PORT}/`. 
- Ports: `${API_PORT}:3000`. 
 
## Next.js (web) 
- Builds from `./web`, waits/depends on `postgrest` + `auth`. 
- Ports: `${WEB_PORT}:3000`. 
- Handles login, session state, and UI for ISMS entities. 
- App Router frontend, built with shadcn/ui + TanStack Query/Form. 
- all browser calls to same-origin. No need for CORS. 
- all requests use `lib/fetch-timeout.ts` for ADR-002. 
- other modules: `lib/auth.ts`, `app/providers.tsx`, `whoami.tsx`, `lib/backend/postgrest.ts`, `lib/backend/config.ts`, `lib/browser/config.ts`. 
 
 
# Data Flows 
 
## Authentication Flow 
1. User signs in via GoTrue. 
2. browser calls to `/auth` and `/api`.
3. `auth/[...path]/route.ts` web proxies to GoTrue. 
4. Session (JWT) stored in `localStorage`. 
 
## Data Fetch Flow 
1. React Query issues request → `lib/browser/api-isms.ts:postgrest()` (or `api-app.ts:postgrest()`). 
2. browser calls to `/api`. 
3. `api/[...path]/route.ts` proxies to PostgREST, adding headers as needed (`Accept-Profile`, `Content-Profile`, `Prefer`), forwarding Authorization token. 
3. PostgREST receives call with `Accept-Profile: isms` (or `app`). 
4. Data returned to frontend. 
 
## Error & Timeout Handling 
- fetch wrapper `fetchWithTimeout` (default 15s timeout). 
- Errors surfaced via React Query error boundaries. 
 
## Deployment Notes (Compose) 
- All sensitive values are stored in `docker/.env` (eg. `JWT_SECRET`, `AUTHENTICATOR_PASSWORD`). 
- `docker/.env` is **gitignored** to prevent accidental commits. 
- Examples in `docker/.env.template` are committed. 
- Healthchecks gate startup; migrations run after `db` is healthy. 
- Related scripts: `start.sh`, `test.sh`, `reset.sh`. 
 
## Gotchas 
- Keep sectrets in `.env` (eg. `JWT_SECRET`, `AUTHENTICATOR_PASSWORD`). 
- Healthchecks gate startup order; migrations run after `db` is healthy. 
- PostgREST caches schema at startup → restart after migrations. 
- Role mapping relies on `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`. 
- `auth` schema is private; queries must go through `app` or `isms`. 
- when changing `.env`, remind/remember to edit `.env.template` as well! 
 
# Related 
- Scripts: `start.sh`, `test.sh`, `reset.sh`. 