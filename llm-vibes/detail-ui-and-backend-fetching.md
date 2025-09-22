I just discovered this:

both app/page.tsx:
...
async function fetchApiRoot() {
  return await postgrest<{ info?: { title?: string, version?: string } }>('/', { method: 'GET' }, 'app')
}
export default async function Home() {
  const openapi = await fetchApiRoot()
  return (
    <main style={{ padding: 24 }}>
      <h1>ISMS-App</h1>
      <p>API:</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ title: openapi.info?.title, version: openapi.info?.version }, null, 2)}
      </pre>
...

and whoami.tsx:
...
export default function WhoAmI() {
  const [txt, setTxt] = useState('anonymous')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const who = await postgrest<{ email?: string; role?: string }>('/rpc/whoami', { method: 'POST' }, 'app');
...

use the postgrest() data fetching function.
(it was called pgrst() recently)

however, one of them works, the other does not.
Because:
on app/page.tsx it's called from the node.js backend, working,
and on whoami, it's called from the browser, and does not.

It's impossible to make it work in both cases, because from the ui, we want all calls routed through '/api/...'
and on the backend, we want calls to go to the postgrest api host 'http://dockerhost1:7771/...' directly.

What's the best practice approach to handle this?
don't code yet, walk me through first.

########################################################################
########################################################################

Great catch. You’ve bumped into a real constraint:

* **Client-side data** (e.g. `whoami` in a client component) must call **`/api/...`** so the browser can attach the user’s JWT from `localStorage` and avoid CORS via the proxy.
* **Server-side data** (e.g. `app/page.tsx` during SSR) doesn’t have `localStorage`, and calling a **relative** URL on Node can be brittle or add an unnecessary proxy hop. Here it’s nicer to hit **PostgREST directly** at `INTERNAL_POSTGREST_URL`.

## Best-practice approach

### 1) Provide two *explicit* PostgREST helpers per schema

Make intent clear at the import site instead of “one helper that guesses”:

* **Client variants** — go through the proxy paths and attach JWT:

  * `lib/postgrest/isms.client` → base `'/api'`, sets `Accept-Profile: isms`
  * `lib/postgrest/app.client` → base `'/api'`, sets `Accept-Profile: app`
  * These read the JWT from GoTrue (`auth.getSession()`), which only works in the **browser**.

* **Server variants** — go **direct** to PostgREST internal URL:

  * `lib/postgrest/isms.server` → base `process.env.INTERNAL_POSTGREST_URL`, `Accept-Profile: isms`
  * `lib/postgrest/app.server` → base `process.env.INTERNAL_POSTGREST_URL`, `Accept-Profile: app`
  * Add `import 'server-only'` at the top so Next prevents accidental client usage.

This gives you explicit, composable building blocks and prevents accidental “client helper in server code” (or vice versa). It also aligns with our KB guidance to centralize base URLs and keep schema headers consistent.

### 2) Import the right helper at the call site

* `app/page.tsx` (a **Server Component**) → import **`app.server`** (or `isms.server`) and call PostgREST directly at `INTERNAL_POSTGREST_URL`.
  This is perfect for unauthenticated reads like `GET /` (OpenAPI root).

* `whoami.tsx` (a **Client Component**) → import **`app.client`** so it goes through **`/api/rpc/whoami`** and attaches the **browser JWT** automatically.
  Remember `Accept-Profile: app` (the client helper will set it; your logs confirmed 404 when it was `isms`).

### 3) (Optional for later) If you want server-side authenticated calls

Right now, your JWT lives in `localStorage` only. If, in the future, you want **server** code to make authenticated PostgREST calls:

* Store session in an **HTTP-only cookie** (or use a server session store).
* Then the **server helper** can read the token from cookies/headers and forward it.
  Until then, keep authenticated reads/writes in client components (via the client helper), and keep SSR/server fetches for public endpoints or where auth isn’t needed.

### 4) Keep the proxies & env consistent

* Proxies (`/app/api/[...path]`) stay for **browser calls** (client helpers).
* `INTERNAL_POSTGREST_URL` continues to point at `http://dockerhost1:7771` for **server helpers**.
* Both paths still use `fetchWithTimeout` (ADR-002: 15s cap).

---

## KB updates to reflect this pattern

* **`kb-4010-api-overview.md`**
  Document the **two helper families**:

  * *Client* helpers (proxy + JWT from `auth.getSession()` + profile headers + `no-store`).
  * *Server* helpers (direct to `INTERNAL_POSTGREST_URL`, `import 'server-only'`, profile headers, `no-store`).
    Keep the bullets about centralized URL getters and headers.

* **`kb-5010-nextjs-app-overview.md`**
  In “Key Files”, list:

  * `lib/postgrest/isms.client` + `lib/postgrest/app.client` (browser)
  * `lib/postgrest/isms.server` + `lib/postgrest/app.server` (server)
    Add a note: **Client components** use client variants (JWT from browser). **Server components** use server variants (direct).

* **`kb-1010-architecture-overview.md`**
  Under Data Flows, clarify:

  * Browser → `/api` proxy → PostgREST (client helpers).
  * Server → `INTERNAL_POSTGREST_URL` (server helpers) for public/SSR reads.

* **`kb-2010-operations-environment-and-scripts.md`**
  In Troubleshooting, note that with proxy mode, **client** calls shouldn’t hit CORS; issues come from proxy config or missing profile headers. Server calls use `INTERNAL_POSTGREST_URL`.

---

### TL;DR

* **Two helpers per schema**: `.client` → `/api` with browser JWT; `.server` → `INTERNAL_POSTGREST_URL` for SSR.
* Import the one that matches where your code runs.
* This keeps concerns clean, avoids URL parsing issues on Node, and matches our KB/ADR direction (thin proxies, PostgREST first).

########################################################################
########################################################################


great! with some adjustments:
first:
* call the browser component `lib/browser/api-isms` and `lib/browser/api-app`
* and the backend component `lib/backend/postgrest-isms` and `lib/backend/postgrest-app`

second:
* since the /api calls from the browser are authenticated, can't we simply forward that authentication to the postrgest endpoint?

########################################################################
########################################################################


Love the naming—clear and self-documenting.

## Final module layout

* **Browser (goes through `/api`)**

  * `lib/browser/api-isms` → base `'/api'`, sets `Accept-Profile: isms` (+ `Content-Profile` for writes), attaches **Bearer JWT from the browser session**.
  * `lib/browser/api-app` → base `'/api'`, sets `Accept-Profile: app` (+ `Content-Profile` for writes), attaches **Bearer JWT**.
  * Why: client code must supply the JWT since it lives in `localStorage`; PostgREST expects `Authorization: Bearer …` and profile headers per schema.

* **Backend (direct to PostgREST)**

  * `lib/backend/postgrest-isms` → base `process.env.INTERNAL_POSTGREST_URL`, headers as above; import `'server-only'`.
  * `lib/backend/postgrest-app` → base `process.env.INTERNAL_POSTGREST_URL`, headers as above; import `'server-only'`.
  * Use in Server Components/Server Actions/route handlers. (Good for public/SSR reads like `GET /` OpenAPI root.)

## About “simply forwarding authentication”

* **Yes**: our App Router proxy **already forwards** incoming headers (incl. `Authorization`) as-is to PostgREST. That’s the right approach.
* **But**: the proxy can only forward what it receives. Because GoTrue stores the session in **localStorage**, the browser won’t automatically send a JWT unless **your client fetch sets `Authorization: Bearer <token>`**. So the browser helpers must attach the JWT; the proxy will forward it unchanged. This matches our KB pattern: get the token from the auth session and set `Authorization` on PostgREST calls, plus the schema headers.

### When would the proxy add auth for you?

If/when we move sessions to an **HTTP-only cookie**, the proxy could read the cookie and inject `Authorization` server-side. Today we’re **not** using cookies, so client helpers should keep setting the header.

## What to update in the KB (light edits)

* **`kb-4010-api-overview.md`**: Document two “families” of helpers (browser vs. backend) and that browser variants attach the JWT + schema headers; backend variants use `INTERNAL_POSTGREST_URL`.
* **`kb-5010-nextjs-app-overview.md`**: In “Key Files”, list the four modules with intended usage; remind that client components must use the browser variants so the JWT from the GoTrue session is attached.
* **`kb-1010-architecture-overview.md`**: In Data Flows, add: browser → `/api` proxy → PostgREST (JWT forwarded); server → `INTERNAL_POSTGREST_URL` (optional auth).
* **`kb-2010-operations-environment-and-scripts.md`** (Troubleshooting): In proxy mode, CORS shouldn’t be needed; most 401/404s are missing `Authorization` or wrong `Accept-Profile`/`Content-Profile`.

## Quick sanity checklist

* Browser helper sends:

  * `Authorization: Bearer <jwt>` (from `auth.getSession()`),
  * `Accept-Profile` / `Content-Profile` = `app` or `isms` as appropriate.
* Proxy logs (when `DEBUG=1`) show the upstream URL and the schema headers (we added this).
* Server helper **does not** try to read `localStorage`; it uses `INTERNAL_POSTGREST_URL` and is `server-only`.

If you’re happy with this shape, I’ll map the existing code to those four paths and keep the proxy forwarding exactly as-is.

########################################################################
########################################################################

perfect — here are the two **browser-only** helpers. they:

* run only in the browser (`'use client'` + runtime guard),
* hit the proxy base `'/api'`,
* attach the user JWT from GoTrue,
* set `Accept-Profile` / `Content-Profile` (schema-specific),
* default `Prefer: return=representation` on writes,
* use the shared `fetchWithTimeout` (15s),
* return parsed JSON as a typed generic.

---

### `lib/browser/api-isms.ts`

```ts
'use client'

import { getPostgrestUrl } from '@/lib/config'
import { auth } from '@/lib/auth'
import { fetchWithTimeout } from '@/lib/fetch-timeout'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('lib/browser/api-isms is browser-only. Use lib/backend/postgrest-isms on the server.')
  }
}

/**
 * Browser PostgREST helper bound to the `isms` schema.
 * - Calls the App Router proxy at /api
 * - Adds Accept-Profile/Content-Profile
 * - Attaches JWT from GoTrue session
 * - 15s timeout, no-store
 * - Parses and returns JSON as T
 */
export async function postgrest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  ensureBrowser()

  const base = getPostgrestUrl() // '/api'
  const method = ((init.method || 'GET').toUpperCase() as Method)

  const headers = new Headers(init.headers || {})
  headers.set('Accept-Profile', 'isms')
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', 'isms')
    if (!headers.has('Prefer')) headers.set('Prefer', 'return=representation')
  }

  // Attach user JWT (from browser session)
  const { data } = await auth.getSession()
  const token = data?.session?.access_token
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetchWithTimeout(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  })

  if (!res.ok) {
    // surface PostgREST error payloads
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `PostgREST error ${res.status}`)
  }

  // some endpoints (e.g. DELETE) may return empty body
  const text = await res.text()
  return (text ? JSON.parse(text) : (undefined as unknown)) as T
}
```

---

### `lib/browser/api-app.ts`

```ts
'use client'

import { getPostgrestUrl } from '@/lib/config'
import { auth } from '@/lib/auth'
import { fetchWithTimeout } from '@/lib/fetch-timeout'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('lib/browser/api-app is browser-only. Use lib/backend/postgrest-app on the server.')
  }
}

/**
 * Browser PostgREST helper bound to the `app` schema.
 * Ideal for RPCs like /rpc/whoami, admin_grant_app_role, etc.
 */
export async function postgrest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  ensureBrowser()

  const base = getPostgrestUrl() // '/api'
  const method = ((init.method || 'GET').toUpperCase() as Method)

  const headers = new Headers(init.headers || {})
  headers.set('Accept-Profile', 'app')
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', 'app')
    if (!headers.has('Prefer')) headers.set('Prefer', 'return=representation')
  }

  // Attach user JWT (from browser session)
  const { data } = await auth.getSession()
  const token = data?.session?.access_token
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetchWithTimeout(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `PostgREST error ${res.status}`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : (undefined as unknown)) as T
}
```

---

**usage examples**

* `whoami` (client component):

```ts
import { postgrest } from '@/lib/browser/api-app'
const who = await postgrest<{ email?: string; role?: string }>('/rpc/whoami', { method: 'POST' })
```

* list applications (client component):

```ts
import { postgrest } from '@/lib/browser/api-isms'
const apps = await postgrest<any[]>('/applications?select=*')
```

when you’re ready, i’ll wire up the **backend** counterparts (`lib/backend/postgrest-*`) with `import 'server-only'` and `INTERNAL_POSTGREST_URL`.
