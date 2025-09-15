#!/usr/bin/env bash

echo "loading .env..."
set -a
source .env
set +a

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
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '{sub,role,aud,exp}'

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

