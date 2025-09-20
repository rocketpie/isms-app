#!/usr/bin/env bash
set -euo pipefail

# Check preconditions
command -v curl >/dev/null || { echo "curl not found"; exit 1; }
command -v jq   >/dev/null || { echo "jq not found";   exit 1; }
command -v docker >/dev/null || { echo "docker not found"; exit 1; }
[ -f .env ] || { echo ".env file not found"; exit 1; }

echo "setting environment variables from .env..."
set -a; source .env; set +a

require_env() { : "${!1:?$1 missing}"; }
require_env BASE_HOST
require_env AUTH_PORT
require_env API_PORT
require_env POSTGRES_DB

# DB container used for dev bootstrap
DB_CONTAINER=${DB_CONTAINER:-isms-app-db-1}

# test users
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASS=${ADMIN_PASS:-Passw0rd!longer}
EDITOR_EMAIL=${EDITOR_EMAIL:-editor@example.com}
EDITOR_PASS=${EDITOR_PASS:-Passw0rd!longer}

# base URLs
auth_url="http://${BASE_HOST}:${AUTH_PORT}"
api_url="http://${BASE_HOST}:${API_PORT}"

note() { printf "\n==> %s\n" "$*"; }
die()  { printf "ERROR: %s\n" "$*" >&2; exit 1; }


# ---------------------------
# Tests
# ---------------------------

note "Smoke test: PostgREST OpenAPI"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" "${api_url}/")
[ "$HTTP" = "200" ] || { echo "PostgREST root returned $HTTP"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '{openapi,info}' | sed 's/^/   /'
rm -f "$TMP"

note "Ensure anon (no token) is blocked on /applications"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" "${api_url}/applications?select=*")
[ "$HTTP" = "401" ] || { echo "Expected 401 without token, got $HTTP"; cat "$TMP"; exit 1; }
rm -f "$TMP"

note "Sign up admin user (autoconfirm ON)"
jq -n --arg email "$ADMIN_EMAIL" --arg pass "$ADMIN_PASS" '{email:$email,password:$pass}' > /tmp/admin_signup.json
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${auth_url}/signup" \
  -H "Content-Type: application/json" \
  --data @/tmp/admin_signup.json)
[ "$HTTP" = "200" ] || { echo "Admin signup failed ($HTTP)"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '{id, email, confirmed_at}' | sed 's/^/   /'
#rm -f "$TMP" /tmp/admin_signup.json
cat /tmp/admin_signup.json


note "Sign up editor user"
jq -n --arg email "$EDITOR_EMAIL" --arg pass "$EDITOR_PASS" '{email:$email,password:$pass}' > /tmp/editor_signup.json
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${auth_url}/signup" \
  -H "Content-Type: application/json" \
  --data @/tmp/editor_signup.json)
[ "$HTTP" = "200" ] || { echo "Editor signup failed ($HTTP)"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '{id, email, confirmed_at}' | sed 's/^/   /'
rm -f "$TMP" /tmp/editor_signup.json

note "Login helper"
get_token () {
  local email="$1" pass="$2"
  curl -sS -X POST "${auth_url}/token?grant_type=password" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${pass}\"}" | jq -r '.access_token'
}

ADMIN_TOKEN=$(get_token "$ADMIN_EMAIL" "$ADMIN_PASS")
[ -n "$ADMIN_TOKEN" ] || { echo "Admin token empty"; exit 1; }
EDITOR_TOKEN=$(get_token "$EDITOR_EMAIL" "$EDITOR_PASS")
[ -n "$EDITOR_TOKEN" ] || { echo "Editor token empty"; exit 1; }

echo "    Admin JWT (payload):"
echo "$ADMIN_TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | {sub,role,aud,app_metadata}' | sed 's/^/      /'

echo "    Editor JWT (payload before grant):"
echo "$EDITOR_TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | {sub,role,aud,app_metadata}' | sed 's/^/      /'

# ---------------------------------------------------------------------------
# DEV-ONLY bootstrap: seed the admin's app_metadata.role = "admin" via SQL.
# This avoids needing a service_role token. Requires DB superuser inside the
# db container. Safe for local dev; do not use in prod.
# ---------------------------------------------------------------------------
note "Bootstrap: set admin user's app_metadata.role=admin via SQL"
SQL="update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role','admin') where email = '${ADMIN_EMAIL}';"
docker exec -i "$DB_CONTAINER" psql -U postgres -d "$POSTGRES_DB" -c "$SQL" >/dev/null

# Re-login admin to pick up claim
ADMIN_TOKEN=$(get_token "$ADMIN_EMAIL" "$ADMIN_PASS")
[ -n "$ADMIN_TOKEN" ] || { echo "Admin token empty after bootstrap"; exit 1; }

echo "    Admin JWT (payload after bootstrap):"
echo "$ADMIN_TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | {sub,role,aud,app_role:(.app_metadata.role // null)}' | sed 's/^/      /'

# ---------------------------------------------------------------------------
# Grant editor role using an RPC that runs as SECURITY DEFINER
# Requires SQL migration that creates isms.admin_grant_app_role(email, role)
# and grants EXECUTE to authenticated.
# ---------------------------------------------------------------------------
note "Admin grants editor role to ${EDITOR_EMAIL} via PostgREST RPC"
BODY=$(jq -n --arg email "$EDITOR_EMAIL" --arg role editor '{target_email:$email,new_role:$role}')
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${api_url}/rpc/admin_grant_app_role" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: app" \
  -H "Content-Profile: app" \
  --data "$BODY")
[ "$HTTP" = "200" ] || { echo "RPC grant failed ($HTTP)"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '{id,email,app_metadata}' | sed 's/^/   /'
rm -f "$TMP"

note "Whoami (admin): verify app role via PostgREST view"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  "${api_url}/whoami" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Accept-Profile: app")
[ "$HTTP" = "200" ] || { echo "GET /app.whoami (admin) expected 200, got $HTTP"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '.[0]' | sed 's/^/   /'
rm -f "$TMP"

note "Re-login editor to pick up updated claims"
EDITOR_TOKEN=$(get_token "$EDITOR_EMAIL" "$EDITOR_PASS")
[ -n "$EDITOR_TOKEN" ] || { echo "Editor token empty after grant"; exit 1; }

echo "    Editor JWT (payload after grant):"
echo "$EDITOR_TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | {sub,role,aud,app_role:(.app_metadata.role // null)}' | sed 's/^/      /'

APP_ROLE=$(echo "$EDITOR_TOKEN" | jq -R 'split(".")[1] | @base64d | fromjson | .app_metadata.role // empty' -r)
[ "$APP_ROLE" = "editor" ] || { echo "Expected app_metadata.role=editor, got: '${APP_ROLE:-<none>}'"; exit 1; }

note "Check /app.whoami as editor"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  "${api_url}/whoami" \
  -H "Authorization: Bearer ${EDITOR_TOKEN}" \
  -H "Accept-Profile: app")
[ "$HTTP" = "200" ] || { echo "GET /app.whoami expected 200, got $HTTP"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '.' | sed 's/^/   /'
rm -f "$TMP"

note "RLS write test: POST /applications as editor (needs PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role)"
NEW_APP_JSON=$(mktemp)
jq -n '{name:"App One", owner_id:null, description:"hello world"}' > "$NEW_APP_JSON"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${api_url}/applications" \
  -H "Authorization: Bearer ${EDITOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data @"$NEW_APP_JSON")
if [ "$HTTP" != "201" ]; then
  echo "POST /applications expected 201, got $HTTP"
  echo "Response body:"; cat "$TMP"; echo
  echo "Hint: ensure PostgREST has PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role"
  exit 1
fi
cat "$TMP" | jq '.[0]' | sed 's/^/   /'
rm -f "$TMP" "$NEW_APP_JSON"

note "Read test: GET /applications as editor"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  "${api_url}/applications?select=*" \
  -H "Authorization: Bearer ${EDITOR_TOKEN}")
[ "$HTTP" = "200" ] || { echo "GET /applications expected 200, got $HTTP"; cat "$TMP"; exit 1; }
cat "$TMP" | jq '.[0]' | sed 's/^/   /'
rm -f "$TMP"

note "Negative test: POST /applications with admin should be 403 (admin may not be editor)"
NEW_APP_JSON=$(mktemp)
jq -n '{name:"Admin App", owner_id:null, description:"should be forbidden"}' > "$NEW_APP_JSON"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${api_url}/applications" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @"$NEW_APP_JSON")
[ "$HTTP" = "403" ] || { echo "Expected 403 for admin write (non-editor), got $HTTP"; cat "$TMP"; exit 1; }
rm -f "$TMP" "$NEW_APP_JSON"


note "Done. All tests passed."