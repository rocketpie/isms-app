--- 
title: Schema Migrations – ISMS 
tags: [database, schema, migrations, isms, policies, rls] 
related: [kb-3010-schema-overview, kb-3020-schema-bootstrap-and-app, kb-3099-schema-audit] 
--- 
 
# MIG-010 ISMS Domain Schema 
Defines the **ISMS domain model** — people, ownership, and assets with their interconnections. 
Manipulating these assets is what the entire App is about 
This schema is intentionally **clean**: no triggers, no RLS, no audit hooks. Those are layered on in later migrations. 
 
## Key objects 
- **Entities** (all `uuid` PKs, `name`, optional `owner_id`): 
  - `people` — organizational persons (not app users) 
  - `ownership` — ties assets to `primary_person` + `deputy_person` 
  - `processes`, `applications`, `systems`, `data`, `connections`, `locations` 
- **Junctions** (many-to-many, all **composite PK**): 
  - `process_applications` 
  - `application_systems` 
  - `system_data` 
  - `system_locations` 
  - `location_connections` 
- **FK policy for Junctions**: **ON DELETE CASCADE** from entities to junctions, so deletes don’t get blocked (UI should still confirm). 
- **Indexes**: created on junction *secondary keys* (e.g., `application_id` in `process_applications`) 
 
## Gotchas 
- **No RLS** here — policies are added in [MIG-020 Policies](mig-020-policies.md). 
- All FKs use `ON DELETE CASCADE`, so deleting an asset removes its links. 
- `gen_random_uuid()` requires `pgcrypto` extension (must be enabled earlier). 
- Ownership is **mandatory** for assets but not enforced by constraint — ensure app logic supplies valid `owner_id`. 
 
 
---- 
# MIG-020 ISMS RLS & Grants 
Applies **role-based access control** to all ISMS domain tables. 
Sets up schema grants, enables Row Level Security (RLS) on every base table, and creates idempotent policies for `authenticated` and `editor`. 
 
## Key actions 
- **Schema grants**: 
  - `authenticator, authenticated, editor` → USAGE on `isms` 
  - `authenticated` → SELECT on all tables 
  - `editor` → ALL on all tables, plus USAGE/SELECT/UPDATE on sequences 
  - `admin` → USAGE on `isms` and `app` 
- **RLS**: enabled on all ISMS base tables. 
- **Policies**: 
  - `<table>_read_all`: SELECT for `authenticated` → unrestricted read 
  - `<table>_editor_all`: ALL for `editor` → unrestricted write 
 
## Gotchas 
- Policies are generated dynamically with PL/pgSQL loops; they silently ignore duplicates (`EXCEPTION WHEN duplicate_object`). 
- `authenticated` can always read everything — no row restrictions. Fine for ISMS baseline, but may need refinement later. 
- `editor` has full CRUD without ownership constraints. Ownership-aware policies can be added in future migrations. 
- Be careful with new tables: the DO block only affects existing tables at execution time — rerun or patch if schema changes. 
 