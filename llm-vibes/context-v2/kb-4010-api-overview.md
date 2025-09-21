---
title: API Overview (PostgREST & RPC)
tags: [api, postgrest, rpc, routes, security, rls]
related: [kb-3010-schema-overview, kb-5010-nextjs-app-overview, kb-4010-api-overview]
---

headers: `Accept-Profile: isms`

# RPC Examples
- `app.whoami` usage and sample response display in `whoami.tsx`.
- `app.admin_grant_app_role(target_email, new_role)` preconditions (caller `admin`).



**Structure**: routes/components.

**Auth**: token handling (SSR/CSR).

**Patterns**:
- Error handling
- Data fetching


**`lib/api.ts`**

   * Use `NEXT_PUBLIC_POSTGREST_URL` (server-safe absolute URL).
   * Attach JWT from `auth.getSession()`; set `Accept-Profile: isms`.
   * Use `fetchWithTimeout` for every call.
   * Keep `cache: 'no-store'`.
   * This makes all PostgREST reads/writes reliable and capped at 15s.
   
   
   **`lib/config.ts`**

   * Centralize `getPostgrestUrl()` and `getAuthUrl()` with clear error throws if envs are missing.
 