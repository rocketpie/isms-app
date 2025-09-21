---
title: MIG-010 ISMS Domain Schema
tags: [sql, migration, schema, isms, domain-model]
relates_to: [mig-005-app, mig-020-policies, db-schema-overview, row-level-security]
---

# What it does
Defines the **ISMS domain model** — people, ownership, and assets with their interconnections.  
This schema is intentionally **clean**: no triggers, no RLS, no audit hooks. Those are layered on in later migrations.

# Key objects
- **Entities** (all `uuid` PKs, `name`, optional `owner_id`):  
  - `people` — organizational persons (not app users)  
  - `ownership` — ties assets to `primary_person` + `deputy_person`  
  - `processes`, `applications`, `systems`, `data`, `connections`, `locations`
- **Junctions** (many-to-many):  
  - `process_applications`  
  - `application_systems`  
  - `system_data`  
  - `system_locations`  
  - `location_connections`
- **Indexes**: created on junction *secondary keys* (e.g., `application_id` in `process_applications`)

# Gotchas
- **No RLS** here — policies are added in [MIG-020 Policies](mig-020-policies.md).  
- All FKs use `ON DELETE CASCADE`, so deleting an asset removes its links.  
- `gen_random_uuid()` requires `pgcrypto` extension (must be enabled earlier).  
- Ownership is **mandatory** for assets but not enforced by constraint — ensure app logic supplies valid `owner_id`.

# Related
- [MIG-020 Policies](mig-020-policies.md) — enables RLS and grants.  
- [Audit schema](mig-030-audit.md) — adds triggers/logging later.  
- [DB schema overview](db-schema-overview.md).
