--- 
title: Schema Migrations – Audit 
tags: [database, schema, migrations, audit, logging] 
related: [kb-3010-schema-overview, kb-3030-schema-isms, kb-3020-schema-bootstrap-and-app] 
--- 
 
# Important: 
This is not in use yet. 
This migration is not run. 
 
# What it does 
Adds a private `audit` schema with a centralized append-only `audit.audit_log` and a `audit.fn_audit()` trigger to capture INSERT/UPDATE/DELETE on ISMS tables. Stores who/when/what (old/new row JSON, PK, table, txid) using JWT helpers from `app`. 
 
# Key objects 
- **Table**: `audit.audit_log(change_id, table_name, row_pk jsonb, change_kind, changed_at, changed_by_* , txid, old_data, new_data)` 
- **Function**: `audit.fn_audit()` (SECURITY DEFINER) builds PK JSON (default `id`, or pass columns via trigger args). 
- **Indexes**: `(table_name, changed_at)` btree, `row_pk` GIN. 
- **Privacy**: schema/table revoked from PUBLIC; RLS enabled (no policies → service-only). 
 
# How to attach 
Example (default PK `id`): 
```sql 
CREATE TRIGGER trg_apps_audit 
AFTER INSERT OR UPDATE OR DELETE ON isms.applications 
FOR EACH ROW EXECUTE FUNCTION audit.fn_audit(); 
``` 
 
Composite/custom PK: 
```sql 
CREATE TRIGGER trg_proc_app_audit 
AFTER INSERT OR UPDATE OR DELETE ON isms.process_applications 
FOR EACH ROW EXECUTE FUNCTION audit.fn_audit('process_id','application_id'); 
``` 
 
# Gotchas 
* **Enum dependency**: uses `isms.change_kind` but it’s not defined in `MIG-010`. Either (a) create enum there, or (b) switch `change_kind` to `text` or (c) define enum in `audit` (commented block). 
* **Extensions**: `gen_random_uuid()` needs `pgcrypto`. 
* **Ownership**: function owner must read `app.jwt_*` and write `audit.audit_log`. 
* **Access**: no reader roles yet; add a view + policies later (e.g., for `editor`). 
 
 