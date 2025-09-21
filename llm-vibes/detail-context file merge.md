i have these 32 knowledge base files, but I can olny upload 20 to your GPT's context.
help me propose 15 new Knowledge base articles that we'll merge these into:

kb-0000-index-overview.md
kb-0010-index-glossary.md
kb-0020-index-faq.md
kb-1010-architecture-components.md
kb-1040-architecture-data-flow-requests.md
kb-2010-operations-local-dev.md
kb-2020-operations-docker-compose.md
kb-2030-operations-env-variables.md
kb-2050-operations-docker-scripts.md
kb-2060-operations-smoke-tests.md
kb-2070-operations-logs-and-debug.md
kb-2080-operations-backup-restore.md
kb-3010-apis-and-schema-db-schema-overview.md
kb-3020-apis-and-schema-mig-001-bootstrap.md
kb-3020-apis-and-schema-mig-005-app.md
kb-3020-apis-and-schema-mig-010-isms.md
kb-3020-apis-and-schema-mig-020-policies.md
kb-3020-apis-and-schema-mig-021-admin_grant_fn.md
kb-3020-apis-and-schema-mig-030-audit.md
kb-3020-apis-and-schema-postgrest-routes.md
kb-3030-apis-and-schema-rpc-examples.md
kb-3040-apis-and-schema-row-level-security.md
kb-4010-security-secrets-handling.md
kb-5010-nextjs-app-app-structure.md
kb-5020-nextjs-app-api-routes.md
kb-5030-nextjs-app-client-auth-helpers.md
kb-6010-runbooks-runbook-first-start.md
kb-6020-runbooks-runbook-ci-cd.md
kb-6030-runbooks-runbook-prod-deploy.md
kb-6040-runbooks-runbook-incident.md
kb-9910-reference-decisions-log.md
kb-9920-reference-changelog.md


Got it ✅ — you currently have **32 KB files** but need to cut them down to **20 slots**, so the best approach is to **merge related docs** into broader, cohesive articles while keeping them searchable.

Here’s a proposal for **15 consolidated KB articles** (leaving you 5 free slots for future growth):

---

### **Index / Reference**

1. **kb-0000-index-overview\.md**
   *(merge: overview + glossary + FAQ)*
   → “Overview, Glossary & FAQ”

2. **kb-9910-reference-history.md**
   *(merge: decisions-log + changelog)*
   → “Decisions & Change History”

---

### **Architecture**

3. **kb-1010-architecture-overview.md**
   *(merge: components + data-flow-requests)*
   → “Architecture & Data Flows”

---

### **Operations**

4. **kb-2010-operations-local-setup.md**
   *(merge: local-dev + env-variables)*
   → “Local Development & Environment Variables”

5. **kb-2020-operations-docker.md**
   *(merge: docker-compose + docker-scripts)*
   → “Docker & Compose Scripts”

6. **kb-2060-operations-quality-debug.md**
   *(merge: smoke-tests + logs-and-debug)*
   → “Testing & Debugging”

7. **kb-2080-operations-backup.md**
   *(just backup-restore, stands alone)*
   → “Backup & Restore”

---

### **APIs & Schema**

8. **kb-3010-schema-overview\.md**
   *(just db-schema-overview, anchor doc)*
   → “Database Schema Overview”

9. **kb-3020-schema-migrations.md**
   *(merge: mig-001-bootstrap + mig-005-app + mig-010-isms)*
   → “Schema Migrations I (Bootstrap & App)”

10. **kb-3021-schema-policies.md**
    *(merge: mig-020-policies + mig-021-admin\_grant\_fn + row-level-security)*
    → “Schema Migrations II (Policies & RLS)”

11. **kb-3022-schema-audit.md**
    *(just mig-030-audit)*
    → “Schema Migrations III (Audit)”

12. **kb-3030-schema-apis.md**
    *(merge: postgrest-routes + rpc-examples)*
    → “PostgREST Routes & RPC Examples”

---

### **Security**

13. **kb-4010-security.md**
    *(just secrets-handling)*
    → “Secrets Handling & Security”

---

### **Next.js App**

14. **kb-5010-nextjs-app.md**
    *(merge: app-structure + api-routes + client-auth-helpers)*
    → “Next.js App (Structure, API Routes & Auth)”

---

### **Runbooks**

15. **kb-6010-runbooks.md**
    *(merge: first-start + ci-cd + prod-deploy + incident)*
    → “Runbooks (Start, CI/CD, Deploy & Incidents)”

---

✅ This reduces **32 → 15 files** while keeping logical grouping.
✅ Leaves you **5 free slots** for future KB additions (like audit partitioning, test data, or incident retros).

---

Do you want me to also propose a **renaming convention** (e.g. keep the `kb-XXXX` numeric prefixes but reassign them for clarity), or keep your current numbering and just merge content?
