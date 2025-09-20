#!/usr/bin/env bash
set -euo pipefail

echo "setting environment variables from .env..."
set -a
source .env
set +a

POSTGRES_DB=${POSTGRES_DB:?POSTGRES_DB missing}
POSTGRES_USER=${POSTGRES_USER:?POSTGRES_USER missing}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD missing}

# DB container name for psql migrations
DB_CONTAINER=isms-app-db-1

echo "docker compose up -d --build..."
docker compose up -d --build

echo "005_app.sql..."
docker exec -i $DB_CONTAINER sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/005_app.sql

echo "010_isms.sql..."
docker exec -i $DB_CONTAINER sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/010_isms.sql

echo "020_policies.sql..."
docker exec -i $DB_CONTAINER sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/020_policies.sql

echo "021_admin_grant_fn.sql..."
docker exec -i $DB_CONTAINER sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/021_admin_grant_fn.sql


# restart postgrest to reload schema cache
docker compose restart postgrest
