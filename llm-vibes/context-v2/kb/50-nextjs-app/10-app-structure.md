---
title: Next.js App Structure
tags: [nextjs, app-router, react-query, tailwind, shadcn]
owner: devops
updated: 2025-09-21
relates_to: [../20-operations/20-docker-compose.md, ../30-apis-and-schema/20-postgrest-routes.md, ../40-security/20-authn-authz-matrix.md]
---

**Purpose**: Describe the Next.js (App Router) frontend that runs in Docker and talks to GoTrue (auth) and PostgREST (ISMS schema).

## Summary
* Auth: `@supabase/gotrue-js` (JWT in `localStorage`)
* Data: PostgREST for all domain CRUD (schema: `isms`)
* Data fetching: React Query
* Styling: Tailwind + shadcn/ui
* Resilience: `fetchWithTimeout` → 15s hard abort on all requests
* `onAuthStateChange`

## Keywords
* NEXT_PUBLIC_POSTGREST_URL
* fetchWithTimeout

## Key directories
* app/applications/page.tsx - CRUD UI for isms.applications
* app/_components/whoami.tsx - Shows current user via /rpc/whoami
* app/error.tsx - Global error boundary
* app/globals.css -Tailwind + global styles
* app/layout.tsx - Header + WhoAmI
* app/login/_client-auth-buttons.tsx - Login/Logout buttons in header
* app/login/page.tsx - Auth UI Sign in/up
* app/page.tsx - Home, probes PostgREST/OpenAPI
* app/providers.tsx - React Query provider + auth listener

* lib/api.ts - PostgREST fetch helper (JWT + timeout)
* lib/auth.ts - GoTrue wrapper
* lib/config.ts - Reads env: PostgREST/Auth URLs
* lib/fetch-timeout.ts - 15s timeout fetch wrapper 'fetchWithTimeout'


## Core flow
* Login → GoTrue returns access/refresh JWT → stored in `localStorage`.
* React Query calls `lib/api.ts` → adds `Authorization: Bearer <JWT>` → calls PostgREST.
* RLS in Postgres restricts rows; service role never in browser.
* Providers (`providers.tsx`) sets QueryClient + subscribes to auth state changes.

## Gotchas
* 401 from PostgREST → expired JWT or wrong issuer/roles. Re-auth.
* CORS must allow the app origin on PostgREST/GoTrue frontends.
* Server Components: don’t access `localStorage`; do data fetching client-side or via server actions with **server-side** secrets (never send service key to client).
* Timeouts: 15s abort is global — long queries should use server endpoints/RPC with pagination.
