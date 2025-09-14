#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?missing}"; : "${POSTGRES_PASSWORD:?missing}"; : "${POSTGRES_DB:?missing}"
: "${AUTHENTICATOR_PASSWORD:?missing}"

export PGPASSWORD="${POSTGRES_PASSWORD}"

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<SQL
-- Runtime roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;

-- App-level 'Editor' role (selected via JWT claim: role=editor)
CREATE ROLE editor NOLOGIN;

-- Connection role for PostgREST
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '${AUTHENTICATOR_PASSWORD}';
GRANT anon, authenticated, editor TO authenticator;

-- GoTrue Schema setup
CREATE ROLE supabase_auth_admin LOGIN NOINHERIT PASSWORD '${POSTGRES_PASSWORD}';

CREATE SCHEMA auth;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, editor;
GRANT USAGE, CREATE ON SCHEMA auth TO supabase_auth_admin;

-- Make unqualified objects go into the auth schema
ALTER ROLE supabase_auth_admin SET search_path = auth, pg_catalog;

-- Core extensions (no schema objects here)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Schema hygiene: Lock down public completely
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM anon, authenticated, editor, authenticator;
SQL

echo "Bootstrap done."