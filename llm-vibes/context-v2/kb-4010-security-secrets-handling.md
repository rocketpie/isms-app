---
title: Secrets Handling
tags: [security, secrets, env, docker]
relates_to: [docker-compose, env-variables, hardening-checklist]
---

# Where secrets live
- All sensitive values are stored in `docker/.env`.  
- This file is **gitignored** to prevent accidental commits.  
- Example values are provided in `docker/.env.template`.

# Best practices
- when changing `.env`, remind to edit `.env.template` as well!

# Related
- [docker-compose](../20-operations/docker-compose.md)  
- [Env Variables](../20-operations/env-variables.md)  
