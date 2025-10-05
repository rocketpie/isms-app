great, All the Asset are there!
now, I want to add a new page, where I can Edit a canvas,
and move around all systems, locations cand connections to make a 'system overview'




########################################################################
########################################################################




Perfect — now that all KBs are loaded, you can add your new **“System Overview Canvas”** page cleanly within the Next.js app structure.

Here’s the plan:

---

## 🧩 Affected Components

* **Frontend:** `app/assets/` (add new `overview/page.tsx`)
* **Hooks/Data:** `lib/browser/isms/*` (for systems, locations, and connections)
* **Schema Reference:** `isms.systems`, `isms.locations`, `isms.connections`

---

## 🧭 Goal

A new page `/assets/overview` where users can visually **drag, drop, and connect**:

* Systems
* Locations
* Connections

This creates an interactive **canvas view** of the ISMS environment.

---

## 🧱 Step-by-Step Implementation

### 1. Create new page

`app/assets/overview/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAssets } from "@/app/_hooks/useAssets";
import { useAssetLinks } from "@/app/_hooks/useAssetLinks";
import { LoadingLine, EmptyState } from "@/app/assets/_components";

export default function SystemOverviewPage() {
  const { data: systems, isLoading: loadingSystems } = useAssets("systems");
  const { data: locations } = useAssets("locations");
  const { data: connections } = useAssetLinks("systems", "connections");

  const [nodes, setNodes] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    if (systems) {
      // simple initial layout grid
      setNodes(
        systems.map((s, i) => ({
          id: s.id,
          x: (i % 5) * 220,
          y: Math.floor(i / 5) * 180,
        }))
      );
    }
  }, [systems]);

  if (loadingSystems) return <LoadingLine />;
  if (!systems?.length) return <EmptyState message="No systems found." />;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">System Overview Canvas</h1>
      <div className="relative w-full h-[80vh] border rounded-lg bg-muted/30 overflow-hidden">
        {nodes.map((n) => {
          const system = systems.find((s) => s.id === n.id);
          return (
            <motion.div
              key={n.id}
              className="absolute p-2 w-48 cursor-move"
              drag
              dragMomentum={false}
              style={{ left: n.x, top: n.y }}
            >
              <Card className="p-3 shadow-md">
                <div className="font-medium">{system?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {system?.description}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
      <Button className="mt-4">Save Layout</Button>
    </div>
  );
}
```

---

### 2. Extend hooks if needed

If you want to persist layout coordinates, add a table `isms.system_layouts(system_id uuid, x numeric, y numeric)` later, or store JSON in app metadata.

Hook skeleton:

```ts
// app/_hooks/useSystemLayout.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postgrest } from "@/lib/browser/api-isms";

export function useSystemLayout() {
  const qc = useQueryClient();
  const { data } = useQuery(["system-layout"], async () => {
    const { data } = await postgrest("/system_layouts?select=*");
    return data ?? [];
  });

  const saveLayout = useMutation({
    mutationFn: async (layout) => {
      await postgrest("/system_layouts", {
        method: "POST",
        body: layout,
        headers: { Prefer: "return=representation" },
      });
    },
    onSuccess: () => qc.invalidateQueries(["system-layout"]),
  });

  return { data, saveLayout };
}
```

---

### 3. Navigation

Add an entry in your asset navigation header (`app/assets/layout.tsx` or `AssetPageHeader.tsx`):

```tsx
<Link href="/assets/overview">Overview Canvas</Link>
```

---

### 4. Styling & UX

* Use **Framer Motion** for smooth drag animations.
* Use **shadcn/ui** cards for visual consistency.
* Connections can later be drawn using `react-flow-renderer` or `react-zoom-pan-pinch` for advanced graph visuals.

---

### ✅ Next Steps

1. Create `/assets/overview/page.tsx` (as above).
2. Test it in Docker dev (`npm run dev`).
3. (Optional) Add `system_layouts` table in SQL to persist coordinates.
4. Integrate `react-flow` to show connections visually.

---

Would you like me to extend this to use **React Flow** (with draggable nodes and visible links from `isms.application_systems` and `isms.system_locations`)? That would make it a true “system topology editor.”



########################################################################
########################################################################



ok. 
well modify the naming a bit:
overview -> maps

maps/
      layout.tsx
      infrastructure/
        page.tsx  # map of all systems, locations, connections
      organization/
        page.tsx  # map of all people, teams (think org chart, Roles)
      processmap/
        page.tsx  # map of processes, applications (suppliers? customers? SIPOCs?)

and we'll reuse the same components (canvas, icons, map_locations etc) for all of these.



-- Maps
CREATE TABLE
  IF NOT EXISTS isms.maps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text
  );

-- Icons
CREATE TABLE
  IF NOT EXISTS isms.icons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    svg text 
    url varchar(255)
  );

-- Map locations
CREATE TABLE
  IF NOT EXISTS isms.map_locations (
    asset_id uuid PRIMARY KEY DEFAULT,
    map_id uuid REFERENCES isms.maps (id) ON DELETE CASCADE,
    map_x float NOT NULL,
    map_y float NOT NULL,
    icon_id uuid REFERENCES isms.icons (id),
    annotation text,
  );

and then useMaps hooks (list maps, list map locations (map) update etc.

and 
//lib/browser/isms/connections.ts
//Description: api-isms '/maps', '/icons', '/map_locations' CRUD
"use client";

import { postgrest } from "../api-isms";
import { ConnectionRow, ConnectionView } from "./assetTypes";

export async function listMaps(){
  return await postgrest<ConnectionView[]>(
    "/maps?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" },
  );
}

export async function listIcons() { 
  return await postgrest<ConnectionView[]>(
    "/icons?select=id,name,svg,url&order=name.asc",
    { method: "GET" },
  );
}

export async function listMapLocations(mapId: string) {
  return await postgrest<ConnectionView[]>(
    `/map_locations?select=asset_id,map_x,map_y,icon(id,name,svg,url),annotation&map_id=eq.${encodeURIComponent(mapId)}`,
    { method: "GET" },
  );
}

feedback?
is the datastructure fine?
am I missing something?

walk me through, before we code
 



########################################################################
########################################################################




Awesome—love the “maps” concept and the reuse idea. Here’s a quick, opinionated design review before we touch code.

# Affected components & KB refs

* **DB:** new `isms.maps`, `isms.icons`, `isms.map_*` tables (RLS/grants integration)
* **API:** PostgREST embedding for labels/joins
* **Frontend:** `app/maps/*` pages, shared canvas components, React Query hooks
* **Policy/RLS:** extend MIG-020 pattern to new tables
* **(Optional) Audit:** still not active by default, so canvas edits won’t be logged unless we wire it later

---

## Data model – what’s great, what to tweak

### ✅ Good

* Separate `maps` and `icons`.
* Storing per-asset coordinates per map (the right level of normalization for UI).
* Planning to reuse one canvas component across multiple map “views”.

### ⚠️ Gaps / gotchas (with fixes)

1. **`map_locations` name collision & PK shape**

   * The table name reads like it stores *location* assets, but you’ll also place `systems`, `connections`, `people`, etc. Suggest **`map_nodes`** to avoid confusion.
   * You’ll place the *same* asset on *multiple* maps. Using `asset_id` as a standalone PK prevents that.
     **Fix:** make **composite PK `(map_id, asset_kind, asset_id)`**.

2. **Polymorphic asset reference**

   * Postgres can’t FK one column to multiple tables. You need an **`asset_kind`** column (enum/text with CHECK) to tell the UI which base table the `asset_id` belongs to (system, location, connection, process, application, person, ownership).
   * Align allowed kinds with `lib/browser/isms/assetTypes.ts` to keep client/server in sync.

3. **Missing timestamps & indexing**

   * Add `created_at/updated_at` and indexes for `map_id` (and frequently queried filters).

4. **`icons` integrity**

   * Either `svg` or `url` may be present. Add a CHECK that **at least one** is set.

5. **`gen_random_uuid()`**

   * Needs `pgcrypto`—make sure it’s enabled earlier (MIG-010 note).

6. **RLS & grants**

   * MIG-020’s DO-block only affects tables existing at execution time; new tables need **explicit** GRANTs / policies (or rerun/patch).

7. **Edges vs. nodes**

   * For *Infrastructure*, you’ll likely render **edges** from existing ISMS relationships (e.g., `system_locations`, `location_connections`, `application_systems`).
   * You may still want a **`map_edges`** table for manual, non-domain lines (annotations, freehand connectors) the user draws on the canvas.

---

## Proposed SQL (tightened)

> Naming: using `map_nodes` to avoid clashing with “locations” asset type.

```sql
-- Maps
CREATE TABLE IF NOT EXISTS isms.maps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL,
  owner_id   uuid REFERENCES isms.ownership (id),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Icons
CREATE TABLE IF NOT EXISTS isms.icons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL,
  svg        text,
  url        varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT icons_svg_or_url CHECK (svg IS NOT NULL OR url IS NOT NULL)
);

-- Map nodes (place ANY asset on ANY map with coordinates + optional icon)
-- asset_kind values should mirror UI types (system|location|connection|process|application|person|ownership)
CREATE TABLE IF NOT EXISTS isms.map_nodes (
  map_id     uuid NOT NULL REFERENCES isms.maps (id) ON DELETE CASCADE,
  asset_kind text NOT NULL CHECK (asset_kind IN
    ('system','location','connection','process','application','person','ownership')),
  asset_id   uuid NOT NULL,
  map_x      double precision NOT NULL,
  map_y      double precision NOT NULL,
  icon_id    uuid REFERENCES isms.icons (id),
  annotation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (map_id, asset_kind, asset_id)
);

-- Optional: manual edges the canvas draws (not domain edges)
CREATE TABLE IF NOT EXISTS isms.map_edges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id       uuid NOT NULL REFERENCES isms.maps (id) ON DELETE CASCADE,
  src_kind     text NOT NULL CHECK (src_kind IN ('system','location','connection','process','application','person','ownership')),
  src_id       uuid NOT NULL,
  dst_kind     text NOT NULL CHECK (dst_kind IN ('system','location','connection','process','application','person','ownership')),
  dst_id       uuid NOT NULL,
  style        jsonb, -- stroke, arrowheads, labels, etc.
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_map_nodes_map ON isms.map_nodes (map_id);
CREATE INDEX IF NOT EXISTS idx_map_edges_map ON isms.map_edges (map_id);
```

### RLS & grants (match MIG-020 conventions)

> Editors: full CRUD; Authenticated: read-only.

```sql
-- Schema usage is already handled for isms; add table grants & RLS
GRANT SELECT ON isms.maps, isms.icons, isms.map_nodes, isms.map_edges TO authenticated;
GRANT ALL    ON isms.maps, isms.icons, isms.map_nodes, isms.map_edges TO editor;

ALTER TABLE isms.maps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE isms.icons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE isms.map_nodes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE isms.map_edges  ENABLE ROW LEVEL SECURITY;

-- read-all / editor-all like MIG-020
DO $$
BEGIN
  PERFORM 1;
  -- SELECT to authenticated
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='maps' AND policyname='maps_read_all') THEN
    EXECUTE 'CREATE POLICY maps_read_all ON isms.maps FOR SELECT TO authenticated USING (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='icons' AND policyname='icons_read_all') THEN
    EXECUTE 'CREATE POLICY icons_read_all ON isms.icons FOR SELECT TO authenticated USING (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='map_nodes' AND policyname='map_nodes_read_all') THEN
    EXECUTE 'CREATE POLICY map_nodes_read_all ON isms.map_nodes FOR SELECT TO authenticated USING (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='map_edges' AND policyname='map_edges_read_all') THEN
    EXECUTE 'CREATE POLICY map_edges_read_all ON isms.map_edges FOR SELECT TO authenticated USING (true);';
  END IF;

  -- ALL to editor
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='maps' AND policyname='maps_editor_all') THEN
    EXECUTE 'CREATE POLICY maps_editor_all ON isms.maps FOR ALL TO editor USING (true) WITH CHECK (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='icons' AND policyname='icons_editor_all') THEN
    EXECUTE 'CREATE POLICY icons_editor_all ON isms.icons FOR ALL TO editor USING (true) WITH CHECK (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='map_nodes' AND policyname='map_nodes_editor_all') THEN
    EXECUTE 'CREATE POLICY map_nodes_editor_all ON isms.map_nodes FOR ALL TO editor USING (true) WITH CHECK (true);';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='isms' AND tablename='map_edges' AND policyname='map_edges_editor_all') THEN
    EXECUTE 'CREATE POLICY map_edges_editor_all ON isms.map_edges FOR ALL TO editor USING (true) WITH CHECK (true);';
  END IF;
END$$;
```

> Why this approach? It mirrors our **read-all / editor-all** policy model in MIG-020 so UI stays simple (everyone can read; editors can write).

---

## API layer (browser helpers)

You suggested adding to `lib/browser/isms/connections.ts`, but this is really a new domain. Let’s create **`lib/browser/isms/maps.ts`** to keep things tidy (plus types that match the new tables).

Also, adopt **embedding** for owner & icon labels (as you already did)—this fits our ADR to shape reads in PostgREST.

```ts
// lib/browser/isms/maps.ts
"use client";
import { postgrest } from "../api-isms";

export type MapRow = { id: string; name: string; description?: string | null; owner?: { id: string; name: string } | null; };
export type IconRow = { id: string; name: string; svg?: string | null; url?: string | null; };
export type MapNodeView = {
  map_id: string;
  asset_kind: string;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon?: IconRow | null;
  annotation?: string | null;
};

export async function listMaps() {
  return await postgrest<MapRow[]>(
    "/maps?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" }
  );
}

export async function listIcons() {
  return await postgrest<IconRow[]>(
    "/icons?select=id,name,svg,url&order=name.asc",
    { method: "GET" }
  );
}

export async function listMapNodes(mapId: string) {
  return await postgrest<MapNodeView[]>(
    `/map_nodes?select=map_id,asset_kind,asset_id,map_x,map_y,icon:icons(id,name,svg,url),annotation&map_id=eq.${encodeURIComponent(mapId)}`,
    { method: "GET" }
  );
}
```

> Note: endpoint names match your new tables and the embedding pattern we use elsewhere.

---

## Frontend file map (pages + shared canvas)

```
app/
  maps/
    layout.tsx        # shared header/toolbar for map views
    _components/
      Canvas.tsx
      MapNode.tsx
      MapEdges.tsx     # optional overlay (manual edges)
      MapToolbar.tsx   # zoom, snap, grid toggle, icon picker
    infrastructure/
      page.tsx         # systems + locations (+ edges from isms junctions)
    organization/
      page.tsx         # people + ownership (org chart)
    processmap/
      page.tsx         # processes + applications (SIPOC-ish)
```

This matches our page/hook/component split guideline and app structure.

---

## How edges render per view

* **Infrastructure:** derive edges from domain relations (e.g., `system_locations`, `location_connections`, `application_systems`). They exist today in MIG-010.
* **Organization:** people ↔ ownership: may need a simple “reports-to” or “parent_team_id” in the future; for now, place nodes without edges or add `map_edges` to sketch structure.
* **Process map:** derive edges from `process_applications` (already in schema).

---

## One-pass setup checklist

1. Apply **SQL** above (plus `pgcrypto` if not on already).
2. Add **RLS grants/policies** block (read-all/editor-all).
3. Create **`lib/browser/isms/maps.ts`** with list funcs (as shown).
4. Scaffold **`app/maps/layout.tsx`** and the three pages; wire the shared `Canvas` component.
5. Start with **drag + persist** of `map_nodes` only; show domain edges read-only; add `map_edges` later if needed.
6. (Optional) If you want audit trails of canvas moves, we can wire the **audit** trigger later (not active now).

---

## Answers to your specific questions

* **Is the data structure fine?**
  Conceptually yes, with the **two key adjustments**: (1) rename to `map_nodes` (or keep `map_locations` but it’s misleading), (2) use **composite PK (map_id, asset_kind, asset_id)** and add `asset_kind`. Add timestamps, indexes, and RLS policy parity.

* **Am I missing something?**

  * RLS/grants for new tables (MIG-020 parity).
  * Optionally `map_edges` for freehand connectors.
  * `icons` integrity check and timestamps.
  * Frontend file split + a clean `maps.ts` helper instead of piggy-backing on `connections.ts`.
  * Embedding on reads (you already did that).

---

## One targeted follow-up (so we wire edges right)

For the **Infrastructure** view: do you want **connections** represented as **edges** (lines between systems/locations) or as **draggable nodes** (like network devices) — or **both** (node + edges to endpoints)?
Your answer will decide whether we only derive edges from ISMS junctions or also place connection nodes on the canvas.
 



########################################################################
########################################################################




-- Maps
CREATE TABLE
  IF NOT EXISTS isms.maps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    owner_id uuid REFERENCES isms.ownership (id),
    description text,
  );

-- Icons
CREATE TABLE
  IF NOT EXISTS isms.icons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(255) NOT NULL,
    data jsonb NOT NULL, -- svg / url / stroke, arrowheads, labels, etc.
  );

-- Map nodes (asset locations on a map)
-- Attention: keep in sync with kb-4015-api-asset-kinds.md
CREATE TABLE
  IF NOT EXISTS isms.map_nodes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    map_id uuid REFERENCES isms.maps (id) ON DELETE CASCADE,
    asset_kind varchar(255) NOT NULL CHECK (
      asset_kind IN (
        'person',
        'ownership',
        'process',
        'application',
        'system',
        'location',
        'data',
        'connection',
        'data_category'
      )
    ),
    asset_id uuid NOT NULL,
    map_x float NOT NULL,
    map_y float NOT NULL,
    icon_id uuid REFERENCES isms.icons (id),
    data jsonb NOT NULL, -- annotation / color / border / labels etc.
  );

CREATE INDEX IF NOT EXISTS idx_map_nodes_map ON isms.map_nodes (map_id);

icons integrity -> i just made it jsonb, so we can solve that in the app
map edges -> well, connections are assets as well, and maybe we'll put that into the json data

Le'ts build 
app/lib/browser/isms/maps.ts next  



########################################################################
########################################################################




"use client";

import { postgrest } from "../api-isms";
// If you already define these in lib/browser/isms/assetTypes.ts, you can import from there instead.
export type MapAssetKind =
  | "person"
  | "ownership"
  | "process"
  | "application"
  | "system"
  | "location"
  | "data"
  | "connection"
  | "data_category";

// -----------------------------
// Row Types (aligned with new tables)
// -----------------------------
export type MapRow = {
  id: string;
  name: string;
  description?: string | null;
  owner?: { id: string; name: string } | null; // embedded from ownership
};

export type IconRow = {
  id: string;
  name: string;
  data: unknown; // jsonb (svg/url/style etc.)
};

export type MapNodeRow = {
  id: string;
  map_id: string;
  asset_kind: MapAssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon_id?: string | null;
  data: unknown; // jsonb (annotation/style/labels)
};

export type MapNodeView = {
  id: string;
  map_id: string;
  asset_kind: MapAssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon?: IconRow | null; // embedded
  data: unknown;
};

// -----------------------------
// Maps CRUD
// -----------------------------
export async function listMaps() {
  return await postgrest<MapRow[]>(
    "/maps?select=id,name,description,owner:ownership(id,name)&order=name.asc",
    { method: "GET" }
  );
}

export async function createMap(input: {
  name: string;
  description?: string | null;
  owner_id?: string | null;
}) {
  return await postgrest<MapRow[]>(
    "/maps",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: [
        {
          name: input.name,
          description: input.description ?? null,
          owner_id: input.owner_id ?? null,
        },
      ],
    }
  );
}

export async function updateMap(mapId: string, patch: {
  name?: string;
  description?: string | null;
  owner_id?: string | null;
}) {
  return await postgrest<MapRow[]>(
    `/maps?id=eq.${encodeURIComponent(mapId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.owner_id !== undefined ? { owner_id: patch.owner_id } : {}),
      },
    }
  );
}

export async function deleteMap(mapId: string) {
  return await postgrest<null>(
    `/maps?id=eq.${encodeURIComponent(mapId)}`,
    { method: "DELETE" }
  );
}

// -----------------------------
// Icons CRUD
// -----------------------------
export async function listIcons() {
  return await postgrest<IconRow[]>(
    "/icons?select=id,name,data&order=name.asc",
    { method: "GET" }
  );
}

export async function createIcon(input: { name: string; data: unknown }) {
  return await postgrest<IconRow[]>(
    "/icons",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: [input],
    }
  );
}

export async function updateIcon(iconId: string, patch: { name?: string; data?: unknown }) {
  return await postgrest<IconRow[]>(
    `/icons?id=eq.${encodeURIComponent(iconId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.data !== undefined ? { data: patch.data } : {}),
      },
    }
  );
}

export async function deleteIcon(iconId: string) {
  return await postgrest<null>(
    `/icons?id=eq.${encodeURIComponent(iconId)}`,
    { method: "DELETE" }
  );
}

// -----------------------------
// Map Nodes CRUD & helpers
// -----------------------------
export async function listMapNodes(mapId: string) {
  return await postgrest<MapNodeView[]>(
    `/map_nodes?select=id,map_id,asset_kind,asset_id,map_x,map_y,icon:icons(id,name,data),data&map_id=eq.${encodeURIComponent(
      mapId
    )}`,
    { method: "GET" }
  );
}

export async function createMapNode(input: {
  map_id: string;
  asset_kind: MapAssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon_id?: string | null;
  data?: unknown;
}) {
  return await postgrest<MapNodeRow[]>(
    "/map_nodes",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: [
        {
          map_id: input.map_id,
          asset_kind: input.asset_kind,
          asset_id: input.asset_id,
          map_x: input.map_x,
          map_y: input.map_y,
          icon_id: input.icon_id ?? null,
          data: input.data ?? {},
        },
      ],
    }
  );
}

export async function updateMapNode(nodeId: string, patch: Partial<{
  map_id: string;
  asset_kind: MapAssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon_id: string | null;
  data: unknown;
}>) {
  return await postgrest<MapNodeRow[]>(
    `/map_nodes?id=eq.${encodeURIComponent(nodeId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: patch,
    }
  );
}

export async function moveMapNode(nodeId: string, mapX: number, mapY: number) {
  return await postgrest<MapNodeRow[]>(
    `/map_nodes?id=eq.${encodeURIComponent(nodeId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: { map_x: mapX, map_y: mapY },
    }
  );
}

export async function deleteMapNode(nodeId: string) {
  return await postgrest<null>(
    `/map_nodes?id=eq.${encodeURIComponent(nodeId)}`,
    { method: "DELETE" }
  );
}

// -----------------------------
// Bulk helpers (simple sequential versions)
// For high-volume bulk moves you might prefer a server RPC to batch updates.
// -----------------------------
export async function createMapNodes(rows: Array<{
  map_id: string;
  asset_kind: MapAssetKind;
  asset_id: string;
  map_x: number;
  map_y: number;
  icon_id?: string | null;
  data?: unknown;
}>) {
  if (!rows.length) return [] as MapNodeRow[];
  return await postgrest<MapNodeRow[]>(
    "/map_nodes",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: rows.map((r) => ({
        map_id: r.map_id,
        asset_kind: r.asset_kind,
        asset_id: r.asset_id,
        map_x: r.map_x,
        map_y: r.map_y,
        icon_id: r.icon_id ?? null,
        data: r.data ?? {},
      })),
    }
  );
}


Sweet — I added **`lib/browser/isms/maps.ts`** with typed helpers for **maps**, **icons**, and **map_nodes** (lists + CRUD + move). It follows our PostgREST patterns (arrays for list/insert, `Prefer: return=representation`, embedding for icon/owner).

# Affected components & KB

* **DB:** new `isms.maps`, `isms.icons`, `isms.map_nodes` (remember to add RLS/grants like MIG-020)
* **API:** thin browser helper (this file) using `/api` + isms profile headers
* **Frontend:** pages under `app/maps/*` will call these functions via hooks

# Pre-coding SQL nits (quick fixes)

Your DDL has trailing commas that will break `CREATE TABLE`. Here’s a minimal fix **without changing your design**:

```sql
-- Maps
CREATE TABLE IF NOT EXISTS isms.maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  owner_id uuid REFERENCES isms.ownership (id),
  description text
);

-- Icons
CREATE TABLE IF NOT EXISTS isms.icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  data jsonb NOT NULL
);

-- Map nodes
CREATE TABLE IF NOT EXISTS isms.map_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid REFERENCES isms.maps (id) ON DELETE CASCADE,
  asset_kind varchar(255) NOT NULL CHECK (asset_kind IN
    ('person','ownership','process','application','system','location','data','connection','data_category')),
  asset_id uuid NOT NULL,
  map_x double precision NOT NULL,
  map_y double precision NOT NULL,
  icon_id uuid REFERENCES isms.icons (id),
  data jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_map_nodes_map ON isms.map_nodes (map_id);
```

**Notes**

* Used `double precision` for coordinates (Postgres’ canonical float).
* If you want to restrict each asset to a single placement per map, add a unique index:
  `CREATE UNIQUE INDEX IF NOT EXISTS uniq_map_nodes_one_placement ON isms.map_nodes(map_id, asset_kind, asset_id);`

# What’s in `maps.ts`

* **Maps**: `listMaps`, `createMap`, `updateMap`, `deleteMap` (owner embedded).
* **Icons**: `listIcons`, `createIcon`, `updateIcon`, `deleteIcon` (jsonb `data`).
* **Map nodes**: `listMapNodes` (embeds `icon`), `createMapNode`, `updateMapNode`, `moveMapNode`, `deleteMapNode`, `createMapNodes` (bulk insert).

# Next steps (exact)

1. **Run migrations** (after fixing commas): restart PostgREST to refresh schema cache.

   ```bash
   ./docker/start.sh   # applies migrations + restarts PGRST
   ./docker/test.sh    # optional smoke checks
   ```
2. **Add RLS/GRANTs** mirroring MIG-020 (read-all for `authenticated`, all for `editor`).
3. **Create hooks** using React Query (e.g., `app/_hooks/useMaps.ts`, `useMapNodes.ts`) and wire into the new pages under `app/maps/*`.
4. **Canvas component**: read nodes via `listMapNodes(mapId)`, drag to call `moveMapNode(id, x, y)`.
5. **Edges**: since connections are assets, you can either render them as nodes (from `map_nodes`) or derive edges from ISMS junctions on the read path (no extra table needed).

If you want, I can scaffold **`useMaps()` and `useMapNodes()`** hooks next, plus a minimal `app/maps/layout.tsx` and `app/maps/infrastructure/page.tsx` to prove the loop end-to-end.



########################################################################
########################################################################



great, I think next up is
//app/_hooks/useMaps.ts
//Description: hooks to CRUD maps, mapIcons, mapNodes




########################################################################
########################################################################




"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MapAssetKind, MapNodeRow, MapNodeView, MapRow, IconRow } from "@/lib/browser/isms/maps";
import {
  listMaps,
  createMap,
  updateMap,
  deleteMap,
  listIcons,
  createIcon,
  updateIcon,
  deleteIcon,
  listMapNodes,
  createMapNode,
  createMapNodes,
  updateMapNode,
  moveMapNode,
  deleteMapNode,
} from "@/lib/browser/isms/maps";

/**
 * Query Keys for Maps feature
 * Keep keys stable and minimal; prefer per-collection keys for easy invalidation.
 */
export const mapQueryKeys = {
  maps: {
    all: () => ["maps", "all"] as const,
    byId: (id: string) => ["maps", "byId", id] as const,
  },
  icons: {
    all: () => ["map-icons", "all"] as const,
    byId: (id: string) => ["map-icons", "byId", id] as const,
  },
  nodes: {
    byMap: (mapId: string) => ["map-nodes", "byMap", mapId] as const,
    byId: (nodeId: string) => ["map-nodes", "byId", nodeId] as const,
  },
};

// -----------------------------
// Maps — List / Create / Update / Delete
// -----------------------------
export function useMaps() {
  return useQuery({
    queryKey: mapQueryKeys.maps.all(),
    queryFn: () => listMaps(),
    staleTime: 30_000,
  });
}

export function useCreateMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string | null; owner_id?: string | null }) =>
      createMap(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.maps.all() });
    },
  });
}

export function useUpdateMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; description?: string | null; owner_id?: string | null } }) =>
      updateMap(id, patch),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.maps.all() });
      qc.invalidateQueries({ queryKey: mapQueryKeys.maps.byId(id) });
    },
  });
}

export function useDeleteMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMap(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.maps.all() });
    },
  });
}

// -----------------------------
// Icons — List / Create / Update / Delete
// -----------------------------
export function useMapIcons() {
  return useQuery({
    queryKey: mapQueryKeys.icons.all(),
    queryFn: () => listIcons(),
    staleTime: 60_000,
  });
}

export function useCreateIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; data: unknown }) => createIcon(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.icons.all() });
    },
  });
}

export function useUpdateIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; data?: unknown } }) => updateIcon(id, patch),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.icons.all() });
      qc.invalidateQueries({ queryKey: mapQueryKeys.icons.byId(id) });
    },
  });
}

export function useDeleteIcon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIcon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.icons.all() });
    },
  });
}

// -----------------------------
// Map Nodes — List / Create / Bulk Create / Update / Move / Delete
// -----------------------------
export function useMapNodes(mapId: string | null | undefined) {
  return useQuery({
    queryKey: mapId ? mapQueryKeys.nodes.byMap(mapId) : ["map-nodes", "byMap", "__none__"],
    queryFn: () => (mapId ? listMapNodes(mapId) : Promise.resolve([] as MapNodeView[])),
    enabled: !!mapId,
    staleTime: 5_000,
  });
}

export function useCreateMapNode(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      asset_kind: MapAssetKind;
      asset_id: string;
      map_x: number;
      map_y: number;
      icon_id?: string | null;
      data?: unknown;
    }) =>
      createMapNode({ map_id: mapId, ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) });
    },
  });
}

export function useCreateMapNodes(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<{
      asset_kind: MapAssetKind;
      asset_id: string;
      map_x: number;
      map_y: number;
      icon_id?: string | null;
      data?: unknown;
    }>) =>
      createMapNodes(rows.map((r) => ({ map_id: mapId, ...r }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) });
    },
  });
}

export function useUpdateMapNode(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MapNodeRow> }) => updateMapNode(id, patch),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) });
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byId(id) });
    },
  });
}

export function useMoveMapNode(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) => moveMapNode(id, x, y),
    onMutate: async ({ id, x, y }) => {
      const key = mapQueryKeys.nodes.byMap(mapId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MapNodeView[]>(key);

      if (previous) {
        const optimistic = previous.map((n) => (n.id === id ? { ...n, map_x: x, map_y: y } : n));
        qc.setQueryData<MapNodeView[]>(key, optimistic);
      }

      return { key, previous } as const;
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) });
    },
  });
}

export function useDeleteMapNode(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMapNode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) });
    },
  });
}




########################################################################
########################################################################




Nice progress! I see a few “last-mile” issues worth tightening, plus tiny quality-of-life fixes.

# Affected parts & KB

* **Page:** `app/maps/infrastructure/page.tsx`
* **Hooks:** `useMapNodesOrEmpty` (thin wrapper), underlying `useMapNodes`
* **Helpers:** `lib/browser/isms/maps.ts` (create signature assumptions)
* **KB refs:** page→hook→helper split & query key discipline, embedding pattern, restart PostgREST after schema changes

---

## 1) Edges currently disabled

You pass `false` here:

```ts
const edgesAll = useInfrastructureEdges(false);
```

Change to `true` (or tie it to `!!activeMapId`) so edges render:

```ts
const edgesAll = useInfrastructureEdges(!!activeMapId);
```

---

## 2) Drag → wrong coordinates when zoomed/panned

With `react-zoom-pan-pinch`, your `info.point` is in **screen** coords. You must convert to **content** coords using the current `scale`. Easiest: measure the transformed content rect and divide by `scale`.

**Patch** (minimal changes):

```tsx
// at top of component:
import { useRef } from "react";

// inside InfrastructureMapPage:
const contentRef = useRef<HTMLDivElement | null>(null);

<TransformWrapper initialScale={1} minScale={0.2} maxScale={3} wheel={{ step: 0.06 }}>
  {({ zoomIn, zoomOut, resetTransform, state }) => (
    <>
      {/* ... */}
      <TransformComponent>
        <div
          ref={contentRef}
          className="relative h-[2000px] w-[3000px] bg-[linear-gradient(0deg,transparent_24px,rgba(0,0,0,0.06)_25px),linear-gradient(90deg,transparent_24px,rgba(0,0,0,0.06)_25px)] bg-[size:25px_25px]"
        >
          {/* Edges ... */}

          {nodesFiltered.map((n) => (
            <DraggableNode
              key={n.id}
              node={n}
              label={nameFor(n.asset_kind, n.asset_id)}
              scale={state.scale}
              contentRef={contentRef}
              onDragEnd={(x, y) => moveNode.mutate({ id: n.id, x, y })}
            />
          ))}
        </div>
      </TransformComponent>
    </>
  )}
</TransformWrapper>
```

And update `DraggableNode`:

```tsx
function DraggableNode({
  node, label, onDragEnd, scale, contentRef,
}: {
  node: MapNodeView;
  label: string;
  onDragEnd: (x: number, y: number) => void;
  scale: number;
  contentRef: React.RefObject<HTMLDivElement>;
}) {
  const [pos, setPos] = useState({ x: node.map_x, y: node.map_y });
  useEffect(() => setPos({ x: node.map_x, y: node.map_y }), [node.map_x, node.map_y]);

  return (
    <motion.div
      className={`absolute z-10 border ${kindColor(node.asset_kind)} shadow-sm rounded-xl`}
      style={{ left: pos.x, top: pos.y, width: 192 }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_e, info) => {
        const rect = contentRef.current?.getBoundingClientRect();
        if (!rect || !scale) return;
        // convert screen → content coords, then center the 192x48-ish node
        const worldX = (info.point.x - rect.left) / scale - 96;
        const worldY = (info.point.y - rect.top) / scale - 24;
        const next = { x: Math.max(0, worldX), y: Math.max(0, worldY) };
        setPos(next);
        onDragEnd(next.x, next.y);
      }}
    >
      {/* ... */}
    </motion.div>
  );
}
```

> This keeps drag behavior correct at any zoom.

---

## 3) Create payload shape (avoid unknown columns)

In `AddAssetsPanel.add()` you currently build rows like:

```ts
const rows = selected.map((s, i) => ({
  id: "",                // ❌ let DB default generate id
  asset_kind: s.kind,
  asset_id: s.id,
  map_x: ...,
  map_y: ...,
  data_version: 1,       // ❌ not in schema
  data: { label: null },
} as MapNodeView));

rows.forEach(row => createMapNode.mutate(row));
```

This can fail under PostgREST because `id` and `data_version` aren’t valid on insert. Also your `create` mutation expects an insert shape that your schema actually accepts.

**Two good options:**

### Option A (loop, minimal change)

Change your rows and call signature to only send **valid insert columns**:

```ts
const rows = selected.map((s, i) => ({
  asset_kind: s.kind,
  asset_id: s.id,
  map_x: baseX + (i % 6) * gapX,
  map_y: baseY + Math.floor(i / 6) * gapY,
  data: {},
}));

rows.forEach(row => createMapNode.mutate(row as any)); // if your create expects MapNodeView, update it (below)
```

Then update your `useMapNodes`’s `create` mutation to accept that shape:

```ts
// inside useMapNodes(mapId)
const create = useMutation({
  mutationFn: (input: { asset_kind: AssetKind; asset_id: string; map_x: number; map_y: number; icon_id?: string | null; data?: unknown }) =>
    createMapNode({ map_id: mapId, ...input }),
  onSuccess: () => { /* invalidate map nodes for mapId */ },
});
```

### Option B (preferred) — bulk insert

Add a `createMany` mutation in your hook and use a **single** POST (less chatty):

```ts
// hook
const createMany = useMutation({
  mutationFn: ({ mapId, rows }: { mapId: string; rows: Array<{ asset_kind: AssetKind; asset_id: string; map_x: number; map_y: number; icon_id?: string | null; data?: unknown }>}) =>
    createMapNodes(rows.map(r => ({ map_id: mapId, ...r }))),
  onSuccess: (_res, { mapId }) => qc.invalidateQueries({ queryKey: mapQueryKeys.nodes.byMap(mapId) }),
});

// panel
if (!mapId || selected.length === 0) return;
const rows = selected.map(/* same minimal objects as above */);
createMany.mutate({ mapId, rows });
```

---

## 4) Unused values

You compute `mapIcons` but don’t use it. Either wire an icon picker later or remove the import/state for now.

---

## 5) Minor types/consistency

* You mix `AssetKind` and the map union; that’s fine if they’re identical. If not, align to a single source of truth (your `assetTypes.ts`) to avoid drift.
* If your `useMaps()` / `useMapIcons()` return `{ list }`, stay consistent across hooks (same shape everywhere).

---

## 6) (Optional) UX polish

* Disable panning while dragging a node to avoid gesture conflicts:

  * `TransformWrapper panning={{ excluded: ['.draggable-node'] }}` and add `className="draggable-node"` on node, **or**
  * stop propagation on node pointer down.
* Show edge arrows/labels later via SVG markers.

---

### Net: after 1–3 patches above, you’re production-safe

* Edges visible,
* Drag works at any zoom,
* Inserts won’t fail on unexpected columns,
* Fewer network calls with bulk insert (Option B).

If you want, I can push a patched `page.tsx` with the zoom-aware drag & bulk create wired in, and trim the `mapIcons` usage.
