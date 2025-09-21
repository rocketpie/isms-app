---
title: Tests and Troubleshooting
tags: [operations, tests, smoke, auth, postgrest]
relates_to: [operations-docker-scripts]
---

# Overview
test.sh Runs end-to-end smoke checks against GoTrue + PostgREST:
- OpenAPI root reachable.
- Anonymous access is blocked.
- Sign-up two users (admin/editor), login to get JWTs.
- **Dev bootstrap**: sets admin’s `app_metadata.role=admin` via SQL.
- Calls RPC `app.admin_grant_app_role` to grant editor role.
- Verifies `app.whoami`.
- RLS write/read: editor can `POST /applications`, read it; admin write is **403**.

# Prereqs
- Tools: `curl`, `jq`, `docker`; a populated `.env`.
- Env vars used: `BASE_HOST`, `AUTH_PORT`, `API_PORT`, `POSTGRES_DB`, optional `DB_CONTAINER`.
- PostgREST configured with `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role` and schemas `isms,app`.

# Flow (high level)
1. Hit `${API}/` (200).  
2. `/applications` without token → 401.  
3. Sign up admin/editor (autoconfirm).  
4. **Dev-only** SQL sets admin role.  
5. Admin calls `/rpc/admin_grant_app_role` to set editor’s role.  
6. `/rpc/whoami` for both.  
7. Editor `POST /applications` (201) then GET (200).  
8. Admin `POST /applications` → 403.

# Gotchas
- The admin bootstrap uses DB superuser **inside the container**; do not use in prod.
- RPC calls require headers: `Authorization: Bearer …` and `Accept-Profile: app` / `Content-Profile: app`.
- Container name defaults to `isms-app-db-1`; override via `DB_CONTAINER`.
