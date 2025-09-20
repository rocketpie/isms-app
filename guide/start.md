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
# APP
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/005_app.sql

# ISMS
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/010_isms.sql

# POLICIES
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/020_policies.sql

# AUDIT
docker exec -i isms-app-db-1 sh -lc '
  export PGPASSWORD="$POSTGRES_PASSWORD";
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1
' < supabase/migrations/030_audit.sql















# 1) Confirm what’s in the DB right now
docker exec -it isms-app-db-1 sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 \
    -c "select schema_name from information_schema.schemata where schema_name in ('\''auth'\'','\''app'\'','\''isms'\'');" \
    -c "\dn" \
    -c "\dt auth.*" \
    -c "\dt isms.*"
'


# 1) Create a user (role=editor) via GoTrue
# signup (autoconfirm is on)
curl -s -X POST "http://${BASE_HOST}:${AUTH_PORT}/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "editor@example.com",
    "password": "Passw0rd!longer",
    "app_metadata": { "role": "editor" }
  }' | jq .


# 2) Sign in: get access token
TOKEN=$(curl -s -X POST "http://${BASE_HOST}:${AUTH_PORT}/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","password":"Passw0rd!longer"}' \
  | jq -r '.access_token')

echo "JWT (first 60): ${TOKEN:0:60}..."


Optional sanity: peek at the role claim.
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '{sub,role,aud,app_role:.app_metadata.role}'

You should see `"role":"editor"` and `"aud":"authenticated"`.


# 3) Quick PostgREST smoke test (OpenAPI)
curl -s "http://${BASE_HOST}:${API_PORT}/" | jq '.openapi,.info'


# 4) RLS behavior checks
# No token: should be blocked, since anon has no policies:
curl -i "http://${BASE_HOST}:${API_PORT}/applications?select=*"

# With editor token: should work:
# create a row
curl -i -X POST "http://${BASE_HOST}:${API_PORT}/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"App One","owner_id":null,"description":"hello world"}'

# list rows
curl -s "http://${BASE_HOST}:${API_PORT}/applications?select=*&order=name.asc" \
  -H "Authorization: Bearer $TOKEN" | jq .

# or
curl -i "http://${BASE_HOST}:${API_PORT}/applications" \
  -H "Authorization: Bearer $TOKEN"

#Repeat with any other table, e.g. `people`, `systems`, etc.

# 5) (Optional) Verify app.users mirror is syncing

docker exec -it isms-app-db-1 sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "table app.users limit 5;"
'

