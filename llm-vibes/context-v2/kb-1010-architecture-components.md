---
title: System components
tags: [architecture, overview, components, supabase, nextjs]
relates_to: [data-flow-requests, sequence-auth-flow, db-schema-overview]
---

# Overview
ISMS-App is a Supabase-backed platform built with Postgres, PostgREST, GoTrue, and a Next.js web frontend.  
Each container plays a role in authentication, data access, or UI.

# Components
- **Postgres (db)**  
  - Base database, schema host for `auth`, `app`, `isms`.  
  - Initialized via bootstrap + migration SQL.  
  - Persistent storage via `db_data` volume.  

- **GoTrue (auth)**  
  - Handles sign-up, login, password flows.  
  - Writes to `auth.users`.  
  - Issues JWTs with `app_metadata.role`, consumed by PostgREST.  

- **PostgREST (api)**  
  - Auto-generates REST/RPC endpoints from `isms,app` schemas.  
  - Applies RLS policies to enforce read vs. editor access.  
  - Uses `authenticator` role, escalates to anon/authenticated/editor/admin via JWT claims.  
  - Provides OpenAPI spec for clients/tests.  

- **Next.js (web)**  
  - App Router frontend, built with shadcn/ui + TanStack Query/Form.  
  - Data fetch flow (React Query → `pgrst()` → PostgREST with `Accept-Profile: isms`).
  - Handles login, session state, and UI for ISMS entities.  
  - Add modules: `lib/auth.ts`, `lib/api.ts`, `lib/fetch-timeout.ts`, `app/providers.tsx`, `whoami.tsx`.

# Gotchas
- PostgREST caches schema at startup → restart after migrations.  
- Role mapping relies on `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`.  
- `auth` schema is private; queries must go through `app` or `isms`.  

# Related
- [Data Flow: Requests](data-flow-requests.md)  
- [Sequence: Auth Flow](sequence-auth-flow.md)  
- [DB Schema Overview](../30-apis-and-schema/db-schema-overview.md)
