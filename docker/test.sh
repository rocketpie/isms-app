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

# helper functions
note() { printf "\n==> %s\n" "$*"; }
die()  { printf "ERROR: %s\n" "$*" >&2; exit 1; }

get_token () {
  local email="$1" pass="$2"
  curl -sS -X POST "${auth_url}/token?grant_type=password" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${pass}\"}" | jq -r '.access_token'
}

curl_expect_200_json() {
  local url="$1"; local tmp="$(mktemp)"
  echo "$url..."
  local http=$(curl -sS -o "$tmp" -w "%{http_code}" "$url")
  if [ "$http" != "200" ]; then
    echo "FAILED: (HTTP $http)" >&2
    cat "$tmp" >&2; rm -f "$tmp"; return 1
  fi

  if ! jq empty "$tmp" >/dev/null 2>&1; then
    echo "FAILED: Expected JSON:" >&2
    cat "$tmp" >&2; rm -f "$tmp"; return 1
  fi

  echo "OK (200, JSON)"
  rm -f "$tmp"
}

whoami_expect_role() {
  local token="$1"
  local expected="$2"

  [ -n "$token" ] || { echo "empty token"; exit 1; }
  echo "TODO: evaluate token payload:"
  echo "$token" | jq -R 'split(".")[1] | @base64d | fromjson | {sub,role,aud,app_metadata}' | sed 's/^/      /'

  note "verify app role via /rpc/whoami"
  TMP="$(mktemp)"
  HTTP="$(curl -sS -o "$TMP" -w "%{http_code}" \
    -X POST "${api_url}/rpc/whoami" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -H "Content-Profile: app" \
    -H "Accept-Profile: app" \
    --data '{}')"

  [ "$HTTP" = "200" ] || { echo "POST /rpc/whoami expected 200, got $HTTP"; cat "$TMP"; rm -f "$TMP"; exit 1; }

  # Extract app_role from either object or array payloads
  ROLE="$(jq -r 'if type=="array" then (.[0].app_role // empty) else (.app_role // empty) end' "$TMP")"

  [ -n "$ROLE" ] || { echo "/rpc/whoami did not return app_role:"; cat "$TMP"; rm -f "$TMP"; exit 1; }
  [ "$ROLE" = "$expected" ] || { echo "/rpc/whoami expected app_role='$expected', got '$ROLE'"; cat "$TMP"; rm -f "$TMP"; exit 1; }

  # Optional pretty-print for inspection
  # jq '.' "$TMP" | sed 's/^/   /'
  echo "OK. ('$ROLE')"
  rm -f "$TMP"
}


# Smoke tests 
#################################################################################


note "Smoke test: PostgREST online?"
curl_expect_200_json "${api_url}/"

note "Smoke test: GoTrue online?"
curl_expect_200_json "${auth_url}/health"

note "Smoke test: web container can reach PostgREST and GoTrue internally"
docker compose exec web sh -lc '
set -euo pipefail
apk add --no-cache curl jq >/dev/null

curl_expect_200_json() {
  local url="$1"; local tmp="$(mktemp)"
  echo "$url..."
  local http=$(curl -sS -o "$tmp" -w "%{http_code}" "$url")
  if [ "$http" != "200" ]; then
    echo "FAILED: (HTTP $http)" >&2
    cat "$tmp" >&2; rm -f "$tmp"; return 1
  fi

  if ! jq empty "$tmp" >/dev/null 2>&1; then
    echo "FAILED: Expected JSON:" >&2
    cat "$tmp" >&2; rm -f "$tmp"; return 1
  fi

  echo "OK (200, JSON)"
  rm -f "$tmp"
}

: "${INTERNAL_GOTRUE_URL:?INTERNAL_GOTRUE_URL missing}"
: "${INTERNAL_POSTGREST_URL:?INTERNAL_POSTGREST_URL missing}"
echo "Internally (what the backend hits)"

curl_expect_200_json "${INTERNAL_GOTRUE_URL}/health"
curl_expect_200_json "${INTERNAL_POSTGREST_URL}/"

echo "Through Next proxies (what browsers hit)"
curl_expect_200_json "http://localhost:3000/auth/health"
'
# TODO: maybe /auth/health and /auth/settings shouldn't work publicly?
# TODO: curl_expect_200_json "http://localhost:3000/api/" won't work.
# maybe the /api route doesn't forward / ?


# Auth tests 
#################################################################################



note "Ensure anon (no token) is blocked on /applications"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" "${api_url}/applications?select=*")
[ "$HTTP" = "401" ] || { echo "Expected 401 without token, got $HTTP"; cat "$TMP"; exit 1; }
rm -f "$TMP"
echo "OK. (HTTP 401)"


note "Sign up admin user (autoconfirm ON)"
jq -n --arg email "$ADMIN_EMAIL" --arg pass "$ADMIN_PASS" '{email:$email,password:$pass}' > /tmp/admin_signup.json
#cat /tmp/admin_signup.json

TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${auth_url}/signup" \
  -H "Content-Type: application/json" \
  --data @/tmp/admin_signup.json)
[ "$HTTP" = "200" ] || { echo "Admin signup failed ($HTTP)"; cat "$TMP"; exit 1; }
# cat "$TMP" # debugging
echo "OK. (HTTP 200)"
jq -r '.user | {email, created_at}' "$TMP" | sed 's/^/   /'
rm -f "$TMP" /tmp/admin_signup.json

# ---------------------------------------------------------------------------
# DEV-ONLY bootstrap: seed the admin's app_metadata.role = "admin" via SQL.
# This avoids needing a service_role token. Requires DB superuser inside the
# db container. Safe for local dev; do not use in prod.
# ---------------------------------------------------------------------------
note "Bootstrap: set admin user's app_metadata.role=admin via SQL"
SQL="update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('role','admin') where email = '${ADMIN_EMAIL}';"
docker exec -i "$DB_CONTAINER" psql -U postgres -d "$POSTGRES_DB" -c "$SQL" >/dev/null
echo "OK?"

ADMIN_TOKEN=$(get_token "$ADMIN_EMAIL" "$ADMIN_PASS")
whoami_expect_role "$ADMIN_TOKEN" "admin"


note "Sign up editor user"
jq -n --arg email "$EDITOR_EMAIL" --arg pass "$EDITOR_PASS" '{email:$email,password:$pass}' > /tmp/editor_signup.json
#cat /tmp/admin_signup.json

TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  -X POST "${auth_url}/signup" \
  -H "Content-Type: application/json" \
  --data @/tmp/editor_signup.json)
[ "$HTTP" = "200" ] || { echo "Editor signup failed ($HTTP)"; cat "$TMP"; exit 1; }
# cat "$TMP" # debugging
echo "OK. (HTTP 200)"
jq -r '.user | {email, created_at}' "$TMP" | sed 's/^/   /'
rm -f "$TMP" /tmp/editor_signup.json

note "TODO: assign some default role to verify after signup"
#EDITOR_TOKEN=$(get_token "$EDITOR_EMAIL" "$EDITOR_PASS")
# whoami_expect_role "$EDITOR_TOKEN" "" 


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
echo "TODO: evaluate:"
jq '{email,app_metadata}' "$TMP" | sed 's/^/   /'
rm -f "$TMP"

EDITOR_TOKEN=$(get_token "$EDITOR_EMAIL" "$EDITOR_PASS")
whoami_expect_role "$EDITOR_TOKEN" "editor"


# PostgREST tests 
#################################################################################


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
echo "TODO: evaluate:"
jq '.[0]' "$TMP" | sed 's/^/   /'
rm -f "$TMP" "$NEW_APP_JSON"

note "Read test: GET /applications as editor"
TMP=$(mktemp)
HTTP=$(curl -sS -o "$TMP" -w "%{http_code}" \
  "${api_url}/applications?select=*" \
  -H "Authorization: Bearer ${EDITOR_TOKEN}")
[ "$HTTP" = "200" ] || { echo "GET /applications expected 200, got $HTTP"; cat "$TMP"; exit 1; }
jq '.[0]' "$TMP" | sed 's/^/   /'
rm -f "$TMP"
echo "OK. (HTTP 200)"

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
echo "OK. (HTTP 403)"

note "Done. All tests passed."