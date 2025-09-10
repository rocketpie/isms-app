there's a lot of static stuff in bootstrap.sh now, i thought that was only for passing the authenticator secret. i can also spot an app schema now. I like the idea of splitting the app data from the actual isms content data. isn't that better suited in an app.sql?

Yes—great catch. Let’s keep bootstrap.sh minimal (only things that truly need secrets / env) and move all app-layer objects (the app schema, auth mirror, JWT helpers) into a dedicated app.sql.

Below is a clean split with exact files.

File layout (updated)
supabase/init/
├─ 000_reset.sh          # destructive dev reset (drops schemas)
├─ 001_bootstrap.sh      # MINIMAL: roles + extensions only (uses env)
├─ 005_app.sql           # app-layer: app.users + trigger + JWT helper funcs
├─ 010_isms.sql          # ISMS entities + auditing (references app.jwt_*)
└─ 020_policies.sql      # grants + RLS (read for all, write for editor)

[...]

wait. where does the audit table belong?

Great question. Let’s reason it out clearly:

---

### Option 1: `isms.audit_log` (current)

* **Pros:**

  * Keeps *all ISMS-related data*, including its change history, **in one schema**.
  * Easy to back up or export ISMS data with history together.
  * Makes sense conceptually if the audit is specifically for **ISMS assets**.
* **Cons:**

  * Blurs a little the line between **app infrastructure** and **domain content** because audit tracks **app users** and actions.
  * If later you want auditing for other app tables (not just ISMS), you’d need a second audit log or rename it.

---

### Option 2: `app.audit_log`

* **Pros:**

  * Clear separation: `app.*` schema is for the **application itself** (users, roles, sessions, logs).
  * Fits if you want a **single auditing mechanism** across *all* schemas.
  * Makes sense if audit is part of platform-level observability (not tied to ISMS domain specifically).
* **Cons:**

  * Slightly more work in policies: `app.audit_log` has to grant read selectively.
  * ISMS exports won’t include audit by default (unless you join back).

---

### My recommendation

Since you just clarified that:

* **`people` are assets, not users**
* **Auditing is about what *users* do to the assets**
* **`app` schema already owns user/auth infrastructure**

…it makes more sense to **move `audit_log` to `app.audit_log`**.
That way:

* `app.*` = “meta/app layer” (users, auth, logs)
* `isms.*` = “domain content layer” (assets, relationships)

Auditing still references `app.users.id` naturally.

---

### What changes if we move it

* Rename table and trigger references: `isms.fn_audit()` stays but writes to `app.audit_log`.
* Policies: audit log RLS sits in `app` schema (private by default).
* Everything else is the same: triggers fire from ISMS tables, insert into `app.audit_log`.

---

Would you like me to **rewrite `010_isms.sql`** so audit is in `app.audit_log` instead?
That keeps schemas super clean:

* `app`: `users`, `audit_log`, JWT helpers
* `isms`: processes, assets, relationships only


would it make sense to move auditing into it's own schema? 
yes, audit is more part of the platform (app) than isms content. 
but: users and permissions is small, and long lasting. 
auditing creates more and more data over time, making it suitable for partitioning / archiving / separated storage space, differnt form of backup etc. 
all that comes later, not now. your thoughts?



Yes—put **auditing in its own schema**.

**Why this is smart (now and later):**

* Clean separation: `app` = auth/users (small, stable). `isms` = domain assets. `audit` = high-volume, append-only logs.
* Future-proofing: easy to **partition/retain/archive** audit independently; move to different tablespace/storage; different backup schedule.
* Least privilege: keep `audit` private (service/admin only), expose read views later if needed.

Here’s a tight refactor plan with ready SQL.

---

# What changes

* New schema: **`audit`** with `audit_log`.
* Triggers on `isms.*` call **`audit.fn_audit()`** (moved from `isms`).
* `audit_log.changed_by_user_id` still references `app.users(id)` (login users).

---

# New file: `supabase/init/007_audit.sql`
[...]

# Update `020_policies.sql` (audit stays private)

No change needed for ISMS. You can explicitly lock audit:

```sql
-- keep audit private (no read for authenticated/editor)
REVOKE ALL ON SCHEMA audit FROM authenticated, editor;
REVOKE ALL ON ALL TABLES IN SCHEMA audit FROM authenticated, editor;
```

---

## Partitioning later (when you’re ready)

When audit volume grows, switch to **declarative partitioning** without touching ISMS triggers:

```sql
-- 1) Create a new partitioned parent
CREATE TABLE audit.audit_log_part (
  LIKE audit.audit_log INCLUDING ALL
) PARTITION BY RANGE (changed_at);

-- 2) Swap: insert existing rows, rename tables, recreate indexes if needed.
-- 3) Create monthly partitions
CREATE TABLE IF NOT EXISTS audit.audit_log_2025_09
  PARTITION OF audit.audit_log_part
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

-- 4) Change INSERT target (either rename old to _old and rename _part to audit_log,
--    or change fn_audit to insert into audit.audit_log_part)
```

Or adopt **pg\_partman** later to auto-create partitions.

---

## Bottom line

* ✅ Move to **`audit` schema** now (clean separation).
* ✅ Keep **triggers in ISMS** calling **`audit.fn_audit`**.
* ✅ Leave `audit` **private**; add views/policies later if auditors need read access.
* 🚀 Partition/archival is straightforward when you decide to scale it.
