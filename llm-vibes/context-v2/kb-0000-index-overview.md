---
title: KB Overview, Glossary & FAQ
tags: [documentation, knowledge-base, glossary, faq, reference]
related: [kb-1010-architecture-overview, kb-2010-operations-environment-and-scripts, kb-9910-reference-history]
---

# Purpose
Organize ISMS-App documentation into a **Knowledge Base (KB)*- of small, linkable notes. 
Each file is focused, 600–1,500 chars, with clear names and front-matter metadata. 
This enables precise retrieval and modular context for the GPT assistant.

# File Format
- Markdown (`*.md`).  
- Front-matter: (title, tags, related)
- Body: concise explanation, key objects/actions, gotchas

# Principles
- Link notes via `related`.
- Clear titles — use prefixes like `MIG-010` for migrations.
- Size target: 600–2000 chars (max 3,000).

# KB folder Map
- kb-0000-index-overview
- kb-1010-architecture-overview
- kb-2010-operations-environment-and-scripts
- kb-2015-operations-test-details
- kb-3010-schema-overview
- kb-3020-schema-bootstrap-and-app
- kb-3030-schema-isms
- kb-3099-schema-audit
- kb-4010-api-overview
- kb-5010-nextjs-app-overview
- kb-6010-runbooks-runbook-first-start
- kb-9910-reference-history

# Glossary
- RLS: Row-Level Security in Postgres.  
- Service role: Bypasses RLS; for server-only use.  
- RPC: PostgREST function endpoint.  

# FAQ
## How do I run locally?
See [Runbook first start]
