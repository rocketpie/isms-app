Here’s a concise, ops-oriented summary of what `test.sh` does.

# Purpose

End-to-end smoke test for a PostgREST + Auth setup with RLS and JWT role claims. It:

* signs up **admin** and **editor** users,
* bootstraps the admin’s app role directly in the DB (dev-only),
* uses an RPC to grant the **editor** role,
* verifies JWT claims and access via PostgREST,
* checks RLS for create/read permissions.

# Prereqs / Inputs

* Loads `.env` then requires: `BASE_HOST`, `AUTH_PORT`, `API_PORT`, `POSTGRES_DB`.
* Assumes DB container name `isms-app-db-1` (for `docker exec psql`).
* Uses `jq` (env var `JQ` optional).
* Test users:

  * Admin: `admin@example.com` / `Passw0rd!longer`
  * Editor: `editor@example.com` / `Passw0rd!longer`

# What it does (sequence)

1. **OpenAPI smoke check**: `GET /` on PostgREST; expects 200 and prints `{openapi,info}`.
2. **Anon blocked check**: `GET /applications` without token; expects **401**.
3. **Signup**: registers admin and editor via `${base_url_auth}/signup`; expects **200** for both.
4. **Login**: obtains JWTs via `${base_url_auth}/token?grant_type=password`; prints JWT payloads.
5. **Dev bootstrap (admin role)**: runs SQL in DB container to set `auth.users.raw_app_meta_data.role = "admin"` for the admin, then re-logs in and prints updated payload. *(Dev-only; bypasses need for a service role.)*
6. **Grant editor role via RPC**: calls `POST /rpc/admin_grant_app_role` (SECURITY DEFINER) with admin token to set editor’s app role to `"editor"`; expects **200** and prints updated user.
7. **Whoami checks**:

   * Admin: `GET /whoami` with admin token; expects **200**.
   * Editor: re-login, confirm JWT `app_metadata.role == "editor"`, `GET /whoami`; expects **200**.
8. **RLS write test (editor)**: `POST /applications` as editor; expects **201** and prints created row.
   *Includes hint that PostgREST must have* `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`.
9. **RLS read test (editor)**: `GET /applications`; expects **200**.
10. **Negative test (admin write)**: `POST /applications` as admin; expects **403** (admin is not editor).
11. Prints **Done. All tests passed.**

# Assertions / Expected codes

* 200: OpenAPI root, signups, logins, RPC, whoami, editor read
* 201: editor create `/applications`
* 401: anon `/applications`
* 403: admin attempting editor-only write

# Notable details & requirements

* **JWT claim path:** relies on `.app_metadata.role` (set `PGRST_JWT_ROLE_CLAIM_KEY=.app_metadata.role`).
* **RPC needed:** `isms.admin_grant_app_role(email, role)` must exist, be SECURITY DEFINER, and executable by `authenticated`.
* **Dev-only SQL**: direct mutation of `auth.users.raw_app_meta_data` via superuser inside DB container—**don’t use in prod**.

# Side effects

* Creates two auth users in your auth schema.
* Inserts at least one row in `applications`.
* Modifies admin’s `raw_app_meta_data` directly.

# Failure handling

* `set -euo pipefail`; any failed HTTP status mismatch or empty token exits with a message and dumps the response to help diagnose misconfig (e.g., missing `PGRST_JWT_ROLE_CLAIM_KEY`).

