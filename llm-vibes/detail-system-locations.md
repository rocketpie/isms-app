//lib/browser/isms/systems.ts
//Description: api-isms '/systems' CRUD, owner embedding
"use client";

import { postgrest } from "../api-isms";
import { SystemRow, SystemView } from "./assetTypes";

export async function listSystems() {
  return await postgrest<SystemView[]>(
    "/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createSystem(item: SystemView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: SystemRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<SystemView[]>("/systems", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateSystem(item: SystemView) {
  // strip the owner object
  const { owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: Partial<SystemRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/systems?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    },
  );
}

export async function deleteSystem(id: string) {
  return await postgrest<null>(`/systems?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

systems have a specific requirement that's not relevant for other assets.
They have a location. 

since they don't have n locations, we might need to drop the system_locations, and inline a location_id.

we also need a dropdown in the systems editor.

what else do we need? additional hooks? api helpers?
 




########################################################################
########################################################################





Here’s a tight plan to make **Systems have exactly one `location`** (inline `location_id`) and remove the `system_locations` M:N.

## Affected components

* **Database (isms schema, migrations)** — add `systems.location_id`, drop `system_locations`. 
* **API helpers** — update `lib/browser/isms/systems.ts`, `assetTypes.ts`. 
* **Hooks** — reuse existing asset hooks; add a tiny `useLocationsList()` if you don’t have one already. 
* **UI** — add a `LocationSelect` dropdown to the Systems editor (like `ownerSelect`). Update the Systems page to render it. 
* **Ops** — run the new migration via existing docker scripts. 

---

## 1) DB migration (new MIG)

Create a new migration (e.g., `012_isms_system_location.sql`) that:

* Adds a nullable FK `location_id` on `isms.systems`.
* Backfills from `system_locations` if you want to keep the *first* linked location (optional).
* Drops `isms.system_locations` (and its indexes).
* Leaves RLS/grants untouched (MIG-020 grants are table-wide; a column add doesn’t need policy changes). 

```sql
-- 012_isms_system_location.sql

-- 1) Add inline FK on systems
ALTER TABLE isms.systems
  ADD COLUMN location_id uuid REFERENCES isms.locations(id) ON DELETE SET NULL;

-- 2) OPTIONAL: Backfill one location per system (pick the first by name)
-- If you have duplicates, this picks an arbitrary one; refine as needed.
WITH pick AS (
  SELECT sl.system_id, sl.location_id
  FROM isms.system_locations sl
  JOIN isms.locations l ON l.id = sl.location_id
  QUALIFY ROW_NUMBER() OVER (PARTITION BY sl.system_id ORDER BY l.name NULLS LAST) = 1
)
UPDATE isms.systems s
SET location_id = p.location_id
FROM pick p
WHERE p.system_id = s.id
  AND s.location_id IS NULL;

-- 3) Drop the M:N table
DROP TABLE IF EXISTS isms.system_locations;

-- Note: MIG-020 already grants SELECT to authenticated and ALL to editor on isms.*. No change needed.
```

**Apply it via docker scripts** (same flow as other migrations): start stack → migrations run → PostgREST restarts to reload schema cache. 

---

## 2) Types (`assetTypes.ts`)

Add `location_id` to the row type and embed `location` in the view type (read-time). We follow the “embed on reads, FK on writes” rule. 

```ts
// lib/browser/isms/assetTypes.ts
export type SystemRow = {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  location_id?: string | null; // NEW
};

export type LabeledRef = { id: string; name: string };

export type SystemView = {
  id: string;
  name: string;
  description?: string | null;
  owner?: LabeledRef | null;
  location?: LabeledRef | null; // NEW
};
```

---

## 3) API helper (`lib/browser/isms/systems.ts`)

* **Reads**: embed `owner` *and* `location`.
* **Writes**: send only `owner_id` and `location_id`. Keep `Prefer: return=representation` where helpful.  

```ts
// lib/browser/isms/systems.ts
"use client";

import { postgrest } from "../api-isms";
import { SystemRow, SystemView } from "./assetTypes";

export async function listSystems() {
  return await postgrest<SystemView[]>(
    "/systems?select=id,name,description,owner:ownership(id,name),location:locations(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function createSystem(item: SystemView) {
  const { id, owner, location, ...rest } = item;
  const dataModel: SystemRow = {
    ...rest,
    owner_id: owner?.id ?? null,
    location_id: location?.id ?? null, // NEW
  };
  const response = await postgrest<SystemView[]>("/systems", {
    method: "POST",
    body: JSON.stringify([dataModel]),
    headers: { Prefer: "return=representation" },
  });
  return response[0].id;
}

export async function updateSystem(item: SystemView) {
  const { owner, location, ...rest } = item;
  const dataModel: Partial<SystemRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
    location_id: location?.id ?? null, // NEW
  };
  return await postgrest<null>(
    `/systems?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(dataModel),
      headers: { Prefer: "return=representation" },
    },
  );
}

export async function deleteSystem(id: string) {
  return await postgrest<null>(`/systems?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
```

---

## 4) Hook(s)

You likely already have generic asset hooks and a locations helper (`lib/browser/isms/locations.ts`). Expose a tiny list hook to feed the dropdown and keep cache keys consistent with the central `queryKeys`. 

```ts
// app/_hooks/useLocationsList.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { listLocations } from "@/lib/browser/isms/locations";
import { queryKeys } from "./queryKeys";

export function useLocationsList() {
  return useQuery({
    queryKey: queryKeys.assets.all("location"),
    queryFn: () => listLocations(),
    staleTime: 5 * 60 * 1000,
  });
}
```

*(Reads and caches are aligned with our data-flow pattern: page → hook → helper → PostgREST.)* 

---

## 5) UI: `LocationSelect` and Systems editor integration

Make a small `LocationSelect` (mirrors `ownerSelect`) and add it to the Systems editor row/create form. Pages are already split into DisplayRow/EditorRow/CreateForm; just enhance the **Systems** variants to include the dropdown. 

```tsx
// app/_components/locationSelect.tsx
"use client";
import { useLocationsList } from "@/app/_hooks/useLocationsList";

export function LocationSelect({
  value,
  onChange,
  disabled,
}: {
  value: { id: string; name: string } | null | undefined;
  onChange: (v: { id: string; name: string } | null) => void;
  disabled?: boolean;
}) {
  const { data, isLoading } = useLocationsList();
  const items = data ?? [];
  return (
    <select
      className="border rounded-lg p-2"
      value={value?.id ?? ""}
      disabled={disabled || isLoading}
      onChange={(e) => {
        const id = e.target.value || null;
        const picked = items.find((x) => x.id === id) ?? null;
        onChange(picked);
      }}
    >
      <option value="">— No location —</option>
      {items.map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  );
}
```

Then in your **Systems** `EditorRow` and `CreateForm`, add a labeled field:

```tsx
// inside Systems EditorRow/CreateForm
<label className="text-sm font-medium">Location</label>
<LocationSelect value={draft.location ?? null} onChange={(v) => setDraft({ ...draft, location: v })} />
```

This follows the “embed on reads, FK on writes” guideline we use throughout. 

---

## 6) Remove the now-obsolete linking UI

If the Systems page currently shows a “Linked Locations” section using `LinkedAssetsSection` with `system_locations`, drop that section. The single dropdown is now the source of truth. This matches our page/componentization plan. 

---

## 7) React Query invalidation

No special cases required: Systems mutations should already invalidate `queryKeys.assets.all("system")`. If you had lists keyed by `links` for `system_locations`, you can delete those invalidations. 

---

## 8) Test path (smoke)

* Bring stack up and re-run smoke tests; PostgREST is restarted after migrations per `start.sh`. 
* Verify you can:

  1. Create a System with a Location picked;
  2. Edit a System and change its Location;
  3. Read lists showing embedded `location:locations(id,name)`.
     RLS/grants remain as before (authenticated=read, editor=CRUD).  

---

## One decision to confirm

Do you want `location_id` to be **required**? If yes, after the backfill run:

```sql
-- enforce non-null after backfill
ALTER TABLE isms.systems
  ALTER COLUMN location_id SET NOT NULL;
```

(We kept it nullable initially to avoid breaking creates/edits during rollout.)

---

### Why this fits our architecture

* Keeps the schema “clean” (no triggers) and aligns with the domain model being in `isms`. 
* Uses PostgREST **embedding** for labels on reads, FK-only on writes — our standard ADR.  
* Fits existing page/hook/helper layering without new infrastructure.  

If you want, I can also supply a quick PR patch for the Systems page to wire in `LocationSelect`.


Medical References:
1. None — DOI: file-WQe2m5Q42S9ew4CDdzWBFV
2. None — DOI: file-738oUxzVQURK2zqvQXKTLQ
3. None — DOI: file-6LUs5JsuR1p5XXWsDAqZ6T
4. None — DOI: file-23YgrbqKuwFGowSAFyx8X7
5. None — DOI: file-QsxjaT49Bd1VuKWJZ165Nm
6. None — DOI: file-8b1zjD6Gd6zWzsbf6F8Rnk
7. None — DOI: file-KovaeqVCoRnmS4Fnc6zo1E
8. None — DOI: file-9Dyx8uB4BfTciYdqr7Lrgi

^^^ Uuuh, what's this? it pasted from ChatGPT, but it's not shown in the UI.
see attached Screenshot
########################################################################
########################################################################




