---
title: API Routes (Client → PostgREST)
tags: [nextjs, api, postgrest, auth, fetch]
relates_to: [client-auth-helpers, postgrest-routes, rpc-examples, row-level-security]
---

# Overview
The Next.js app does **not** expose custom API routes.
Instead, UI code calls PostgREST directly using helpers in `lib/`.
This keeps the stack slim and leans on RLS.

# Files
- `lib/api.ts` — thin wrapper around `fetch` (base URL, headers, JSON, errors).
- `lib/auth.ts` — login/session helpers, obtains **JWT** for `Authorization: Bearer …`.
- `lib/config.ts` — reads base URLs/ports from env.
- `lib/fetch-timeout.ts` — abort controller for request timeouts.
- `app/_components/whoami.tsx` — example RPC caller.

# Conventions
- **Base URL**: `${BASE_HOST}:${API_PORT}` from `config.ts`.
- **Auth**: `Authorization: Bearer <jwt>`.
- **Schemas**:
  - ISMS tables: default (`isms`) → no profile headers.
  - `app` RPCs/tables: include  
    `Accept-Profile: app` and `Content-Profile: app`.
- **Writes**: prefer returning rows  
  `Prefer: return=representation`.

# Examples
- List apps: `GET /applications?select=*`
- Create app: `POST /applications` (+ body JSON, Prefer header)
- Who am I: `POST /rpc/whoami` (app profile headers)
- Grant role: `POST /rpc/admin_grant_app_role` (admin JWT, app profile headers)

# Error Handling
- Network/timeouts via `fetch-timeout.ts`.
- Surface PostgREST errors (status ≥400) with JSON message; map 401/403 to auth UI.

# Gotchas
- RLS depends on `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`; ensure JWTs include `app_metadata.role`.
- Restart PostgREST after schema changes to refresh cache.
- For SSR/Server Actions, pass the JWT from cookies; for client components, use `auth.ts` session store.

# Related
- [PostgREST Routes](../30-apis-and-schema/postgrest-routes.md)
- [RPC Examples](../30-apis-and-schema/rpc-examples.md)
- [Client Auth Helpers](client-auth-helpers.md)
