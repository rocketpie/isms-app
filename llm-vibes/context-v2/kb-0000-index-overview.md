---
title: KB Overview, Glossary & FAQ
tags: [documentation, knowledge-base, structure, glossary, faq, reference]
relates_to: [operations-local-dev, apis-schema]
---

# Purpose
Organize ISMS-App documentation into a **Knowledge Base (KB)** of small, linkable notes. 
Each file is focused, 600–1,500 chars, with clear names and front-matter metadata. 
This enables precise retrieval and modular context for the GPT assistant.

# File Format
- Markdown (`*.md`).  
- Front-matter: (title, tags, relates_to)
- Body: concise explanation, key objects/actions, gotchas, related links.

# Principles
* One topic per file — keep notes atomic.
* Link notes via `relates_to`.
* Clear titles — use prefixes like `MIG-010` for migrations.
* Size target: 600–1,500 chars (max 2,000).

**KB folder Map**:
* 00-index: overview, glossary, faq
* 10-architecture: components, data-flow-requests
* 20-operations: local-dev, docker-compose, env-variables, docker-scripts, smoke-tests, logs-and-debug, backup-restore
* 30-apis-and-schema: db-schema-overview, mig-001-bootstrap, mig-005-app, mig-010-isms, mig-020-policies, mig-021-admin_grant_fn, mig-030-audit, postgrest-routes, rpc-examples, row-level-security
* 40-security: secrets-handling, threat-model, hardening-checklist
* 50-nextjs-app: app-structure, api-routes, client-auth-helpers, error-boundaries
* 60-runbooks: runbook-first-start, runbook-ci-cd, runbook-prod-deploy, runbook-incident
* 99-reference: decisions-log, changelog

# Glossary
- RLS: Row-Level Security in Postgres.  
- Service role: Bypasses RLS; for server-only use.  
- RPC: PostgREST function endpoint.  

# FAQ
## How do I run locally?
See [Local Dev Guide](../20-operations/local-dev.md).  

## Why do I get a 401 from PostgREST?
Check JWT issuer/roles and confirm RLS policies are applied.  


# Related
* [Decisions Log](../99-reference/decisions-log.md)  
* [Changelog](../99-reference/changelog.md)  
* [Local Dev](../20-operations/local-dev.md)  
* [APIs & Schema](../30-apis-and-schema/db-schema-overview.md)  