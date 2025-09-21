Perfect—here’s the exhaustive edit plan for **Option A (Next.js App Router proxy)**. I’ve grouped files by area and added why each needs a change. KB items include inline citations.

---

# Frontend code (existing files to modify)

* `web/lib/config.ts`

  * Add `getAuthUrl()` and `getApiUrl()` that now return **relative paths**: `'/auth'` and `'/api'` (no host/port). This centralizes URLs and fails fast if overridden incorrectly, per our KB design for `config.ts`.
* `web/lib/auth.ts`

  * Switch to `url: getAuthUrl()` instead of reading `process.env.NEXT_PUBLIC_GOTRUE_URL` directly (you already flagged this). Keeps all auth calls same-origin via `/auth`.
* `web/lib/api.ts`

  * Point the base to `getApiUrl()` which now returns `'/api'`; continue attaching JWT and `Accept-Profile`/`Content-Profile` headers as before.

> FYI: These three are the heart of the switch to same-origin.

---

# Frontend code (new files to add)

* `web/app/auth/[...path]/route.ts`

  * Thin proxy → forwards all methods (GET/POST/OPTIONS/etc.) to GoTrue container using internal URL (e.g., `http://auth:9999` or whatever it is inside compose). Must pass through body, query, status, and headers (incl. `Authorization`, `content-type`). Disable caching.
* `web/app/api/[...path]/route.ts`

  * Thin proxy → forwards to PostgREST (internal URL). Preserve `Accept-Profile` / `Content-Profile` and `Prefer` headers exactly.

> Both handlers should run on the **Node runtime** and be fully dynamic (no caching). They are transparent pipes—no business logic—so we still “favor PostgREST” for app logic as per our ADRs.

---

# Environment

* `docker/web/.env.local`

  * Change to **relative paths** so the browser never sees cross-origin hosts:

    ```bash
    NEXT_PUBLIC_GOTRUE_URL=/auth
    NEXT_PUBLIC_POSTGREST_URL=/api
    ```

    (Today this file shows absolute dockerhost URLs—those will be updated).
* `.env` (compose)

  * No functional change to ports (they remain the truth for the proxy targets): `AUTH_PORT=7779`, `API_PORT=7771`.
  * Optionally add internal service URLs as NEXT runtime envs for the route handlers to consume (e.g., `INTERNAL_AUTH_URL=http://auth:9999`, `INTERNAL_PGRST_URL=http://postgrest:3000`), not exposed to the browser.

---

# KB docs to update (so the docs match reality)

* **`kb-5010-nextjs-app-overview.md` (Next.js App Overview)**

  * Update **Environment** section from absolute URLs to **relative**:

    * Currently shows:

      ```bash
      NEXT_PUBLIC_GOTRUE_URL=http://dockerhost1:7779
      NEXT_PUBLIC_POSTGREST_URL=http://dockerhost1:7771
      ```

      → change to:

      ```bash
      NEXT_PUBLIC_GOTRUE_URL=/auth
      NEXT_PUBLIC_POSTGREST_URL=/api
      ```

      (This is the place readers look first for web env).
  * In **API Access** and **Gotchas**, note that CORS is avoided via **same-origin proxy** (`/auth`, `/api`) and that handlers forward `Accept-Profile`/`Content-Profile`.

* **`kb-4010-api-overview.md` (API Overview)**

  * Reaffirm `lib/api.ts` uses `NEXT_PUBLIC_POSTGREST_URL` (now `/api`) and that `lib/config.ts` centralizes URL getters (now relative) with explicit throws on missing envs.
  * Add a short “Proxy mode” note: App Router route handlers forward to PostgREST and GoTrue, preserving headers/status.

* **`kb-1010-architecture-overview.md` (Architecture & Data Flows)**

  * In **Next.js (web)** and **Data Flows**, state that the **browser calls same-origin** `/auth` and `/api`, and the web app proxies to GoTrue/PostgREST. Keep the original service ports as deploy facts for compose.

* **`kb-2010-operations-environment-and-scripts.md` (Environment & Scripts)**

  * Optional: Add a **Troubleshooting** note that with proxy mode enabled, CORS should not be needed; issues usually come from route handler config, not service CORS.

* **`kb-2015-operations-test-details.md` (Test & Debug)**

  * Clarify: `docker/test.sh` still calls the services on ports directly (it bypasses the proxy), which is fine and expected.

* **`kb-9910-reference-history.md` (ADR/Changelog)**

  * **Add ADR-004**: “Use same-origin proxy paths `/auth` and `/api` in the Next.js App Router to eliminate CORS; proxies are transparent (no business logic), app logic remains in PostgREST/RPC.”
    (This extends existing ADRs 001–003 listed here).

* **`kb-6010-runbooks-runbook-first-start.md` (Runbook – First Start)**

  * Tiny note: browser talks to `/auth` & `/api`; nothing special needed for CORS in dev.

---

# (Optional) App pages/components

* `web/app/page.tsx` (if it “probes” the OpenAPI endpoint directly)

  * Ensure it uses `'/api'` for health checks (instead of hitting the service port directly).
* `web/app/login/_client-auth-buttons.tsx` & `web/app/login/page.tsx`

  * No direct URL changes needed if `auth.ts` now uses `getAuthUrl()`; review for any hardcoded service URLs.

---

If you’re good with this list, I’ll draft:

1. The two **route handlers** (robust pass-through)
2. Minimal diffs for `config.ts`, `auth.ts`, `api.ts`
3. The **ADR-004** KB entry text and the **env** snippet replacement for `kb-5010` ✅
