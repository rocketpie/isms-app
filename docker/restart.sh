#!/usr/bin/env bash

echo "docker compose up -d --build..."
docker compose up -d --build

echo "005_app.sql..."
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/005_app.sql

echo "010_isms.sql..."
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/010_isms.sql

echo "020_policies.sql..."
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/020_policies.sql


# restart postgrest to reload schema cache
docker compose restart postgrest
