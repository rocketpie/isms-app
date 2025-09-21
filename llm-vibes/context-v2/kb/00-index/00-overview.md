---
title: Overview
tags: []
relates_to: []
---

**Purpose**: One-paragraph summary of the stack and pointers.

**Stack**: 
* Docker: Postgres, PostgREST, GoTrue, Next.js
* Next.js App: @supabase/gotrue-js, React Query, Tailwind

## data flow: 
Browser ⇄ GoTrue (JWT) ⇄ PostgREST (Bearer) ⇄ Postgres

**KB folder Map**:
* `00-index`: 00-overview.md, 10-glossary.md, 20-FAQ.md
* `10-architecture`: components, flows
* `20-operations`: dev, docker, env, bootstrap, migrations, smoke tests, debug, backup
* `30-apis-and-schema`: schema, routes, RPC, RLS
* `40-security`: secrets, authz matrix, threat model, hardening
* `50-nextjs-app`: app structure, API calls, client auth helpers, error boundaries
* `60-runbooks`: first start, CI/CD, deploy, incidents
* `99-reference`: ADRs, changelog