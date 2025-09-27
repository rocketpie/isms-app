

Great—let’s capture this refactor in the KB so the pattern is repeatable.

# Affected components & KBs

* **Frontend**: patterns & foldering → `kb-5010-nextjs-app-overview`, `kb-5015-nextjs-app-postgrest-embedding`
* **API usage**: browser helpers & PostgREST conventions → `kb-4010-api-overview`
* **Architecture**: React Query ⇄ PostgREST data flow → `kb-1010-architecture-overview`
* **Schema notes**: FK + junction behavior → `kb-3010-schema-overview`, `kb-3030-schema-isms`
* **Ops & testing**: test shape & scaffolding → `kb-2015-operations-test-details`, `kb-2010-operations-environment-and-scripts`
* **Runbook & history**: how to use + changelog → `kb-6010-runbooks-runbook-first-start`, `kb-9910-reference-history`

Below are **ready-to-paste sections** (titles + code) for each KB.

---

## kb-5010-nextjs-app-overview — “UI composition & folder layout”

### Componentization rules (pages → components)

* **Split pages** into:

  * `DisplayRow` (read-only view)
  * `EditorRow` (inline edit)
  * `ProcessCreateForm` (new row)
  * Feature sub-sections (e.g., `LinkedApplicationsSection`)
* **Move data-fetching/mutations** into **feature hooks** under `app/_hooks/*`.
* **Share types** under `lib/types/*`.
* **Share API calls** under `lib/browser/isms/*`.

### Standard layout

```
lib/
  browser/
    api-isms.ts              # PostgREST wrapper
    isms/
      processes.ts           # list/create/update/delete
      process-applications.ts# linking helpers
  types/
    isms.ts                  # ProcessView, ProcessRow, etc.

app/
  _hooks/
    queryKeys.ts             # central keys
    useProcesses.ts          # feature hook
    useProcessApplications.ts
  processes/
    page.tsx
    _components/
      DisplayRow.tsx
      EditorRow.tsx
      ProcessCreateForm.tsx
      LinkedApplicationsSection.tsx
```

### Query Keys (canonical)

```ts
// app/_hooks/queryKeys.ts
export const qk = {
  processes: ['processes'] as const,
  ownership: ['ownership'] as const,
  allApplications: ['applications', 'all'] as const,
  processApplications: (processId: string) =>
    ['process', processId, 'applications'] as const,
};
```

---

## kb-5015-nextjs-app-postgrest-embedding — “Embed for reads, FK for writes”

### Conventions

* **Reads**: use **embedded selects** for nice UI labels:

  * `/processes?select=id,name,description,owner:ownership(id,name)`
* **Writes**: send **foreign keys** only (`owner_id`), never nested objects.
* Use `Prefer: return=representation` for POST/PATCH to hydrate UI with server-truth.
* Use **optimistic updates** in React Query; always `invalidateQueries` on settle.

### Example

```ts
// Read (embed)
GET /processes?select=id,name,description,owner:ownership(id,name)&order=name.asc

// Create (FK only)
POST /processes
[{ "name":"X", "description":null, "owner_id":"<uuid>|null" }]
Prefer: return=representation
```

---

## kb-4010-api-overview — “Browser helpers & mutations”

### Thin browser modules per domain

* `lib/browser/isms/processes.ts` — CRUD for processes.
* `lib/browser/isms/process-applications.ts` — list/link/unlink, create-and-link.

### PostgREST wrapper expectations

* Adds auth headers (RLS), passes through `Prefer`, throws rich errors.
* All helpers return **arrays** for list/insert (per PostgREST), and `null` for DELETE.

---

## kb-1010-architecture-overview — “Data flow & state”

### Data flow (page → hook → helper → PostgREST)

1. Page is **presentational**: composes rows/sections.
2. Feature **hook** owns cache keys, optimistic updates, invalidations.
3. **Helper** hits PostgREST, shapes read embeds, FK writes.
4. RLS enforced by service; client only shapes requests.

## Caching rules
* Reads keyed by **resource + params** (see `queryKeys`).
* Mutations must **invalidate** impacted keys.
* Shared lookups (e.g., `ownership`) are **global keys** and reused everywhere.

---

## kb-3010-schema-overview / kb-3030-schema-isms — “Relations & junctions”

### Owner relationship

* `processes.owner_id → ownership.id` (nullable).
* UI embeds `owner:ownership(id,name)` on reads; writes set `owner_id`.

### Junctions

* `process_applications(process_id, application_id)` is a **composite PK**.
* Recommended FK policy: **ON DELETE CASCADE** from `processes` / `applications` to junctions, so deletes don’t get blocked (UI should still confirm).

---

## kb-2015-operations-test-details — “Testing components & hooks”

### Hooks

* Unit-test `useProcesses` and `useProcessApplications` with a **mocked `postgrest`** helper.
* Assert: optimistic update behavior, invalidations, error rollbacks.

### Components

* Test `ProcessCreateForm`:

  * Renders while owners are loading.
  * Submits name-only, optional description/owner.
  * Clears fields on success and calls `onCreated`.

### Example test scaffold

```ts
// Arrange React Query client per test and mock helpers
// Use @testing-library/react + jest.fn() for create mutation results
```

---

## kb-2010-operations-environment-and-scripts — “Scaffolding”

Add **plop** (or simple `pnpm` scripts) to scaffold features:

```json
// package.json
{
  "scripts": {
    "gen:feature": "node scripts/scaffold-feature.mjs"
  }
}
```

`scaffold-feature.mjs` should create:

* `app/_hooks/use<Feature>.ts`
* `lib/browser/<domain>/<feature>.ts`
* `app/<route>/_components/*`
* Add stub tests.

---

## kb-6010-runbooks-runbook-first-start — “Using the new components”

* To add a new CRUD page:

  1. Define types in `lib/types/*`.
  2. Create domain helpers in `lib/browser/<domain>/*`.
  3. Add `use<Feature>()` hook with keys + optimistic updates.
  4. Compose `DisplayRow`, `EditorRow`, `CreateForm` in the page.
* Permissions:

  * **Read**: `authenticated`
  * **Write**: `editor`
  * Errors will surface in `ProcessCreateForm` (standard error block).

---

## kb-9910-reference-history — “Changelog”

```
[YYYY-MM-DD] UI refactor pattern adopted:
- Split pages into DisplayRow / EditorRow / CreateForm.
- Domain hooks in app/_hooks with central queryKeys.
- Shared types in lib/types; domain API in lib/browser/<domain>.
- Embedded reads + FK writes enforced across features.
- Added ProcessCreateForm as reusable component.
```

---

## Common components you already have (and what to add)

**Already extracted / mentioned**

* `OwnerSelect` (reusable, loads owners if not provided).
* `ProcessCreateForm` (self-contained create flow).
* `DisplayRow` / `EditorRow` (inline list row pattern).
* `LinkedApplicationsSection` (feature section with its own hook).

**Add these to round it out**

* `ErrorBanner` (standardize error rendering & RLS hint).
* `ConfirmButton` (wraps confirm() UX for destructive actions).
* `LoadingLine` / `EmptyState` (consistent loading/empty visuals).
* `SearchInput` (with debounced `onChange`, used by sections like applications).
* `EntityPicker` (generic select fed by a query + labelKey/idKey).

I can push these **ready-to-paste sections** into each KB file verbatim. If you tell me which KBs to update first, I’ll drop the exact text under the right headings.
