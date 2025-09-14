#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?missing}"; : "${POSTGRES_PASSWORD:?missing}"; : "${POSTGRES_DB:?missing}"
: "${AUTHENTICATOR_PASSWORD:?missing}"

export PGPASSWORD="${POSTGRES_PASSWORD}"

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<SQL
-- Runtime roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;

-- App-level “Editor” role (selected via JWT claim: role=editor)
CREATE ROLE editor NOLOGIN;

-- Connection role for PostgREST
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '${AUTHENTICATOR_PASSWORD}';
GRANT anon, authenticated, editor TO authenticator;

-- Core extensions (no schema objects here)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Schema hygiene: Lock down public completely
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM anon, authenticated, editor, authenticator;
SQL

echo "Bootstrap done."