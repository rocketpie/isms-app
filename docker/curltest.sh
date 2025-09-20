#!/usr/bin/env bash
set -euo pipefail

# --- config ---
URL="http://dockerhost:7779/signup"
OUT_REQ_HEADERS="req_headers.txt"
OUT_REQ_BODY="req_body.txt"
OUT_RES_HEADERS="res_headers.txt"
OUT_RES_BODY="res_body.txt"

# --- build request ---
cat >"$OUT_REQ_HEADERS" <<'EOF'
Accept: application/json
Content-Type: application/json
EOF

cat >"$OUT_REQ_BODY" <<'EOF'
{
  "email": "admin@example.com",
  "password": "Passw0rd!longer"
}
EOF

echo "===== REQUEST HEADERS ====="
cat "$OUT_REQ_HEADERS"
echo
echo "===== REQUEST BODY ====="
cat "$OUT_REQ_BODY"
echo

# Build curl args from headers
curl_headers=()
while IFS= read -r line; do
  [ -n "$line" ] && curl_headers+=( -H "$line" )
done < "$OUT_REQ_HEADERS"

# Run curl
curl -sS -D "$OUT_RES_HEADERS" -o "$OUT_RES_BODY" \
  -X POST "$URL" \
  "${curl_headers[@]}" \
  --data-binary @"$OUT_REQ_BODY"

# --- show response ---
echo
echo "===== RESPONSE HEADERS ====="
cat "$OUT_RES_HEADERS"
echo
echo "===== RESPONSE BODY ====="
cat "$OUT_RES_BODY"