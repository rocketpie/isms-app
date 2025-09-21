---
title: Client Auth Helpers
tags: []
owner: devops
updated: 2025-09-21
relates_to: []
---**Structure**: routes/components.

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
 