---
title: Operations – Environment & Scripts
tags: [operations, environment, scripts, docker, compose, supabase]
related: [kb-1010-architecture-overview, kb-2015-operations-test-details, kb-6010-runbooks-runbook-first-start]
---

All scripts wrap common tasks (dev starting, migrations, tests, dev reset).

# Docker Environment
BASE_HOST=dockerhost
WEB_PORT=7770
API_PORT=7771
AUTH_PORT=7779

POSTGRES_USER=postgres
POSTGRES_PASSWORD=placeholder
POSTGRES_DB=postgres

## PostgREST 
AUTHENTICATOR_PASSWORD=placeholder
PGRST_DB_SCHEMAS=isms,app
PGRST_DB_ANON_ROLE=anon

## GoTrue <-> PostgREST
JWT_SECRET=REPLACE_ME_super_random_256bit
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=true

---
# Docker Scripts
all scripts in `docker/`
Provide entry points for setup and development of the docker stack. 
no need to remember `docker` `psql` or `curl` incantations.

## start.sh
- Load `.env` → exports `POSTGRES_DB/USER/PASSWORD`.  
- Brings up containers (`docker compose up -d --build`).  
- Applies SQL migrations in order: `005_app.sql`, `010_isms.sql`, `020_policies.sql`, `021_admin_grant_fn.sql`.  
- Restarts PostgREST to reload schema cache.

## test.sh
- Smoke tests: sign-up/login admin + editor, bootstrap admin role, grant editor via RPC.  
- Verifies JWTs, `/rpc/whoami`, RLS writes/reads.  
- Ensures PostgREST/Auth are wired up correctly.

## reset.sh
- Destroys containers (`docker compose down`).  
- Deletes Postgres volume `isms-app_db_data` to wipe DB.  
- Used to start fresh in dev.

## Usage
```bash
cp .env.example .env   # ensure required vars exist
./docker/reset.sh   # optional: nuke db
./docker/start.sh   # bring up & migrate
./docker/test.sh    # run smoke checks
```

## Troubleshooting
docker compose logs -f db auth postgrest web

---
# Local dev scripts
all scripts in `scripts/`
Provide entry points for local development of the Next.js app
embedded into vscode tasks

## npm.ps1
- run docker node:22-alpine, bind-mounting `docker/web`, enabling easy access to `npm run dev`
- exposes 3000:3000 for browser access

## rsync.sh
- sync all `docker/*` files to a docker host, to run the compose stack

# Usage
- run vscode task 'docker npm' 
- cd /web
- npm run dev
- visit http://localhost:3000/

