#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?missing}"; : "${POSTGRES_PASSWORD:?missing}"; : "${POSTGRES_DB:?missing}"
: "${AUTHENTICATOR_PASSWORD:?missing}"

CONN="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"

psql -v ON_ERROR_STOP=1 "$CONN" <<SQL
-- Roles for PostgREST role-switching
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '${AUTHENTICATOR_PASSWORD}';
GRANT anon, authenticated, service_role TO authenticator;

-- App-level “Editor” role (selected via JWT claim: role=editor)
CREATE ROLE editor NOLOGIN;
GRANT editor TO authenticator;

-- Core extensions (no schema objects here)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;
SQL

echo "✔ Bootstrap: roles & extensions ready."
