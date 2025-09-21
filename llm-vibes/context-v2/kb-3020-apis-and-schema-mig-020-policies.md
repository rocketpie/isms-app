---
title: MIG-020 ISMS RLS & Grants
tags: [sql, migration, rls, security, policies, grants]
relates_to: [mig-010-isms, mig-021-admin-grant-fn, row-level-security]
---

# What it does
Applies **role-based access control** to all ISMS domain tables.  
Sets up schema grants, enables Row Level Security (RLS) on every base table, and creates idempotent policies for `authenticated` and `editor`.

# Key actions
- **Schema grants**:  
  - `authenticator, authenticated, editor` → USAGE on `isms`  
  - `authenticated` → SELECT on all tables  
  - `editor` → ALL on all tables, plus USAGE/SELECT/UPDATE on sequences  
  - `admin` → USAGE on `isms` and `app`  
- **RLS**: automatically enabled on all ISMS base tables.  
- **Policies**:  
  - `<table>_read_all`: SELECT for `authenticated` → unrestricted read  
  - `<table>_editor_all`: ALL for `editor` → unrestricted write

# Gotchas
- Policies are generated dynamically with PL/pgSQL loops; they silently ignore duplicates (`EXCEPTION WHEN duplicate_object`).  
- `authenticated` can always read everything — no row restrictions. Fine for ISMS baseline, but may need refinement later.  
- `editor` has full CRUD without ownership constraints. Ownership-aware policies can be added in future migrations.  
- Be careful with new tables: the DO block only affects existing tables at execution time — rerun or patch if schema changes.

# Related
- [MIG-010 ISMS Schema](mig-010-isms.md).  
- [MIG-021 Admin Grant Function](mig-021-admin-grant-fn.md).  
- [Row Level Security](row-level-security.md).
