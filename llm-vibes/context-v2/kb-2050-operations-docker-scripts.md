---
title: Migrations & Startup Scripts
tags: [operations, scripts, tests, migrations, docker, postgres, postgrest]
relates_to: [mig-005-app, mig-010-isms, mig-020-policies, mig-021-admin-grant-fn, local-dev]
---

# What it does
Provides entry points for local development and testing. 
All scripts live under `docker/` and wrap common tasks (migrations, tests, reset) no need to remember `psql` or `curl` incantations.

# Scripts
- **start.sh**  
  - Load `.env` → exports `POSTGRES_DB/USER/PASSWORD`.  
  - Brings up containers (`docker compose up -d --build`).  
  - Applies SQL migrations in order: `005_app.sql`, `010_isms.sql`, `020_policies.sql`, `021_admin_grant_fn.sql`.  
  - Restarts PostgREST to reload schema cache.

- **test.sh**  
  - Smoke tests: sign-up/login admin + editor, bootstrap admin role, grant editor via RPC.  
  - Verifies JWTs, `/rpc/whoami`, RLS writes/reads.  
  - Ensures PostgREST/Auth are wired up correctly.

- **reset.sh**  
  - Destroys containers (`docker compose down`).  
  - Deletes Postgres volume `isms-app_db_data` to wipe DB.  
  - Used to start fresh in dev.


# Usage
```bash
cp .env.example .env   # ensure required vars exist
./docker/reset.sh   # optional: nuke db
./docker/start.sh   # bring up & migrate
./docker/test.sh    # run smoke checks
```