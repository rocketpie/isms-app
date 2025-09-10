# supabase/init/000_reset.sh
#!/usr/bin/env bash
set -euo pipefail

# Uses .env.secrets via docker-compose env_file
# : "${POSTGRES_USER:?missing}"; : "${POSTGRES_PASSWORD:?missing}"; : "${POSTGRES_DB:?missing}"

# CONN_STR="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"

# psql -v ON_ERROR_STOP=1 "$CONN_STR" <<'SQL'
# -- Kill other sessions (use carefully in dev only)
# SELECT pg_terminate_backend(pid)
# FROM pg_stat_activity
# WHERE datname = current_database() AND pid <> pg_backend_pid();

# -- Drop app data/auth-facing schemas from previous runs
# DROP SCHEMA IF EXISTS isms CASCADE;
# DROP SCHEMA IF EXISTS app  CASCADE;

# -- (Optional) clean up leftover objects in public created by earlier attempts
# -- COMMENT/UNCOMMENT as needed:
# -- DROP SCHEMA IF EXISTS public CASCADE;
# -- CREATE SCHEMA public;
# -- GRANT ALL ON SCHEMA public TO postgres;
# -- GRANT USAGE ON SCHEMA public TO PUBLIC;

# -- You now have a clean slate. Next steps will create schemas/tables/policies.
# SQL

# echo "✔ Reset complete: dropped schemas isms and app (CASCADE)."
