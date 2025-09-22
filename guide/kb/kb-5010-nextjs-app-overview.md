--- 
title: Next.js App Overview 
tags: [nextjs, frontend, react-query, tailwind, shadcn, auth, api] 
related: [kb-4010-api-overview, kb-1010-architecture-overview, kb-2010-operations-environment-and-scripts] 
--- 
 
# Purpose 
Describe the Next.js (App Router) frontend that runs in Docker, manages auth via GoTrue, and calls PostgREST for ISMS schema CRUD. 
No custom API routes are exposed — the UI talks directly to PostgREST with thin helpers. 
 
# Environment 
`docker/web/.env.local` 
```bash 
INTERNAL_GOTRUE_URL=http://dockerhost1:7779 
INTERNAL_POSTGREST_URL=http://dockerhost1:7771 
DEBUG=1 
``` 
 
# Summary 
- Auth: `@supabase/gotrue-js` (JWT in `localStorage`). 
- Data: PostgREST for all domain CRUD (`isms` schema). 
- Data fetching: React Query. 
- Styling: Tailwind + shadcn/ui. 
- Resilience: `fetchWithTimeout` → 15s hard abort on all requests. 
- Auth change tracking: `onAuthStateChange`. 
 
# Key Directories & Files 
## `app/` 
- `_components/whoami.tsx` — shows current user via `/rpc/whoami`.
  important: show `${email} (${app_role ?? 'authenticated?'})` since app_role is a defining rpc authorization claim. 
- `applications/page.tsx` — CRUD UI for `isms.applications`. 
- `error.tsx` — global error boundary. 
- `globals.css` — Tailwind + global styles. 
- `layout.tsx` — Header + WhoAmI. 
- `login/_client-auth-buttons.tsx` — login/logout buttons. 
- `login/page.tsx` — auth UI (sign in/up). 
- `page.tsx` — home, probes PostgREST/OpenAPI. 
- `providers.tsx` — React Query provider + auth listener. 
- `api/[...path]/route.ts` - proxies to PostgREST, adding headers as needed (`Accept-Profile`, `Content-Profile`, `Prefer`), forwarding Authorization token. 
- `auth/[...path]/route.ts` - web proxies to GoTrue. 
 
## `lib/` 
- `backend/config.ts` — getPostgrestUrl(), getGoTrueUrl() validate URLs from env. 
- `backend/postgrest.ts` — server-side PostgREST wrapper. Parses JSON response (if any) and returns typed T. 
- `auth.ts` — GoTrue wrapper; login/session helpers, JWT access. 
- `fetch-timeout.ts` — `fetchWithTimeout` wrapper (15s abort). 
- `browser/config.ts` - getAuthUrl() → `/auth` and getApiUrl() → `/api`. 
- `browser/api-isms` — PostgREST (isms) via `/api` + JWT + profile headers. 
- `browser/api-app`  — PostgREST (app)  via `/api` + JWT + profile headers. 
 
# API Access 
## Conventions 
- Base URL: from `config.ts` → `${BASE_HOST}:${API_PORT}`. 
- Auth: `Authorization: Bearer <jwt>`. 
- Schemas: 
  - ISMS tables → default schema, no profile headers. 
  - `app` schema (RPCs/tables) → add `Accept-Profile: app` and `Content-Profile: app`. 
- Writes: `Prefer: return=representation`. 
 
## Examples 
- List applications: `GET /applications?select=*`. 
- Create application: `POST /applications` (+ JSON body, `Prefer` header). 
- Who am I: `POST /rpc/whoami` (with `app` profile headers). 
- Grant role: `POST /rpc/admin_grant_app_role` (admin JWT + app profile headers). 
 
## Error Handling 
- Timeouts handled via `fetch-timeout.ts`. 
- PostgREST errors (`≥400`) surfaced with JSON messages. 
- Map 401/403 to auth UI refresh/re-authentication. 
 
## Core Flow 
1. User logs in → GoTrue returns access/refresh JWT → stored in `localStorage`. 
2. React Query calls `lib/api.ts` → attaches `Authorization: Bearer <JWT>`. 
3. Request hits PostgREST, evaluated by RLS. 
4. Providers (`providers.tsx`) sets up QueryClient + subscribes to auth state changes. 
 
 
# Gotchas 
- RLS: Depends on `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`; JWTs must include role claims. 
- SECURITY DEFINER functions may report `db_role` as the definer; prefer `app_role` from JWT claims for UI.
- Server Components: Cannot use `localStorage`; do client-side fetching or server actions with server-side secrets (never expose service key to client). 
- Timeouts: Global 15s abort — long queries should be paginated or wrapped in RPCs/server endpoints. 
 