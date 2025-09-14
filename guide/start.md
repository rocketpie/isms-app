# Option: Update npm lockfile
~/isms-app$
docker run --rm -v "$PWD/web:/app" -w /app node:20-alpine \
  sh -lc "npm install --package-lock-only --no-audit --no-fund"

then update package-lock.json in the repo

# Option: Check Files
tree
.
├── docker-compose.yml
├── supabase
│   └── init
│       ├── 000_reset.sh
│       ├── 001_bootstrap.sh
│       ├── 005_app.sql
│       ├── 007_audit.sql
│       ├── 010_isms.sql
│       └── 020_policies.sql
└── web
    ├── app
    │   ├── layout.tsx
    │   └── page.tsx
    ├── Dockerfile
    ├── next.config.mjs
    ├── package.json
    ├── package-lock.json
    ├── public
    └── tsconfig.json

# enable execute init scripts
chmod +x supabase/init/000_reset.sh
chmod +x supabase/init/001_bootstrap.sh

# Option: Reset
docker compose down
docker volume rm isms-app_db_data

# Start App
docker compose up -d --build

# Verify running
docker compose ps
docker compose logs -f db auth postgrest web

# Apply bootstrap SQL (run once per fresh reset)
# app
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" isms-app-db-1 \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < supabase/migrations/005_app.sql

# audit
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" isms-app-db-1 \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < supabase/migrations/007_audit.sql

# isms
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" isms-app-db-1 \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < supabase/migrations/010_isms.sql

# policies
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" isms-app-db-1 \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < supabase/migrations/020_policies.sql
