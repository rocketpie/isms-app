// //app/maps/infrastructure/page.tsx
// //Description: map of all systems, locations, connections 
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMaps, useMapNodes, useMapIcons } from "@/app/_hooks/useMaps";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion } from "framer-motion";
import { postgrest } from "@/lib/browser/api-isms";
import type { MapNodeView } from "@/lib/browser/isms/maps";
import { useConnections, useLocations, useSystems } from "@/app/_hooks/useAssets";
import { AssetKind, ConnectionView, LocationView, SystemView } from "@/lib/browser/isms/assetTypes";

const infrastructureKinds = ["system", "location", "connection"] as const;

export function useMapNodesOrEmpty(mapId?: string | null) {
  if (!mapId) {
    const empty = [] as MapNodeView[];
    return {
      list: { data: empty, isFetching: false, isLoading: false, error: null } as const,
      create: { mutate: () => { }, isPending: false } as const,
      update: { mutate: () => { }, isPending: false } as const,
      move: { mutate: () => { }, isPending: false } as const,
      remove: { mutate: () => { }, isPending: false } as const,
    };
  }
  return useMapNodes(mapId); // your original implementation
}


function useInfrastructureAssets() {
  const { list: systemList } = useSystems()
  const { list: locationList } = useLocations();
  const { list: connectionList } = useConnections()

  const systems = useMemo(() => systemList.data ?? [], [systemList.data]);
  const locations = useMemo(() => locationList.data ?? [], [locationList.data]);
  const connections = useMemo(() => connectionList.data ?? [], [connectionList.data]);

  const assetsById = useMemo(() => {
    const map = new Map<string, { kind: AssetKind; id: string; name?: string | null; description?: string | null }>();
    systems.forEach((item: SystemView) => map.set(item.id, { kind: "system", ...item }));
    locations.forEach((item: LocationView) => map.set(item.id, { kind: "location", ...item }));
    connections.forEach((item: ConnectionView) => map.set(item.id, { kind: "connection", ...item }));
    return map;
  }, [systems, locations, connections]);

  return { systems, locations, connections, assetsById };
}

function useInfrastructureEdges(enabled: boolean) {
  const [edges, setEdges] = useState<{ a_kind: AssetKind; a_id: string; b_kind: AssetKind; b_id: string }[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    (async () => {
      try {
        const [slRes, lcRes] = await Promise.all([
          postgrest("/system_locations?select=system_id,location_id", { method: "GET", signal: ac.signal }),
          postgrest("/location_connections?select=location_id,connection_id", { method: "GET", signal: ac.signal }),
        ]);
        const sl = (slRes ?? []) as Array<{ system_id: string; location_id: string }>;
        const lc = (lcRes ?? []) as Array<{ location_id: string; connection_id: string }>;
        const e: { a_kind: AssetKind; a_id: string; b_kind: AssetKind; b_id: string }[] = [];
        sl.forEach((row) => e.push({ a_kind: "system", a_id: row.system_id, b_kind: "location", b_id: row.location_id }));
        lc.forEach((row) => e.push({ a_kind: "location", a_id: row.location_id, b_kind: "connection", b_id: row.connection_id }));
        setEdges(e);
      } catch (err) {
        // ignore aborts; surface others via console for now
        if (!(err as any)?.name?.includes("Abort")) console.error(err);
      }
    })();
    return () => ac.abort();
  }, [enabled]);

  return edges;
}

function kindColor(kind: AssetKind) {
  switch (kind) {
    case "system":
      return "bg-blue-50 border-blue-300";
    case "location":
      return "bg-amber-50 border-amber-300";
    case "connection":
      return "bg-emerald-50 border-emerald-300";
    default:
      return "bg-muted/30 border-muted";
  }
}

// --- Page -----------------------------------------------------------------
export default function InfrastructureMapPage() {
  const { list: mapsList } = useMaps();
  const { list: mapIconList } = useMapIcons();
  const [activeMapId, setActiveMapId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<AssetKind, boolean>>({
    person: false,
    ownership: false,
    process: false,
    application: false,
    system: true,
    data: false,
    location: true,
    connection: true,
    data_category: false
  });

  const maps = useMemo(() => mapsList.data ?? [], [mapsList.data]);
  const mapIcons = useMemo(() => mapIconList.data ?? [], [mapIconList.data]);

  // 1) choose a map once the list arrives
  useEffect(() => {
    if (!activeMapId && maps?.length > 0) setActiveMapId(maps[0].id);
  }, [maps, activeMapId]);

  // 2) ALWAYS call hooks at top-level (no conditionals)
  const { list: mapNodeList, move: moveNode } = useMapNodesOrEmpty(activeMapId ?? null);

  // 3) derive data / computed
  const mapNodes = useMemo(() => mapNodeList.data ?? [], [mapNodeList.data]);

  const { systems, locations, connections, assetsById } = useInfrastructureAssets()
  const edgesAll = useInfrastructureEdges(false);

  const nodesFiltered = useMemo(
    () => mapNodes.filter((n) => (filters as any)[n.asset_kind]),
    [mapNodes, filters]
  );

  const nodePosition = useMemo(() => {
    const m = new Map<string, { x: number; y: number; kind: AssetKind; id: string }>();
    nodesFiltered.forEach((n) =>
      m.set(`${n.asset_kind}:${n.asset_id}`, { x: n.map_x, y: n.map_y, kind: n.asset_kind, id: n.asset_id })
    );
    return m;
  }, [nodesFiltered]);

  const edges = useMemo(
    () => edgesAll.filter((e) => nodePosition.has(`${e.a_kind}:${e.a_id}`) && nodePosition.has(`${e.b_kind}:${e.b_id}`)),
    [edgesAll, nodePosition]
  );

  const nameFor = (kind: AssetKind, id: string) => assetsById.get(id)?.name ?? `${kind}:${id.slice(0, 6)}`;

  return (
    <div className="p-4 flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Infrastructure Map</h1>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Map</label>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={activeMapId ?? ""}
            onChange={(e) => setActiveMapId(e.target.value || null)}
          >
            {maps?.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex gap-2 items-center text-sm">
        {infrastructureKinds.map((k) => (
          <label key={k} className="flex items-center gap-1 select-none">
            <input
              type="checkbox"
              checked={filters[k]}
              onChange={(e) => setFilters((f) => ({ ...f, [k]: e.target.checked }))}
            />
            <span className="capitalize">{k}</span>
          </label>
        ))}
      </div>

      <div className="relative h-[78vh] w-full overflow-hidden rounded-xl border bg-white">
        <TransformWrapper initialScale={1} minScale={0.2} maxScale={3} wheel={{ step: 0.06 }}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute right-3 top-3 z-20 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => zoomOut()}>
                  −
                </Button>
                <Button size="sm" variant="secondary" onClick={() => zoomIn()}>
                  +
                </Button>
                <Button size="sm" variant="secondary" onClick={() => resetTransform()}>
                  Reset
                </Button>
              </div>
              <TransformComponent>
                <div className="relative h-[2000px] w-[3000px] bg-[linear-gradient(0deg,transparent_24px,rgba(0,0,0,0.06)_25px),linear-gradient(90deg,transparent_24px,rgba(0,0,0,0.06)_25px)] bg-[size:25px_25px]">
                  {/* Edges */}
                  <svg className="absolute inset-0 z-0" width="3000" height="2000">
                    {edges.map((e, i) => {
                      const a = nodePosition.get(`${e.a_kind}:${e.a_id}`)!;
                      const b = nodePosition.get(`${e.b_kind}:${e.b_id}`)!;
                      return (
                        <line
                          key={i}
                          x1={a.x + 96}
                          y1={a.y + 24}
                          x2={b.x + 96}
                          y2={b.y + 24}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="text-neutral-300"
                        />
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {nodesFiltered.map((n) => (
                    <DraggableNode
                      key={n.id}
                      node={n}
                      label={nameFor(n.asset_kind, n.asset_id)}
                      onDragEnd={(x, y) => moveNode.mutate({ id: n.id, x, y })}
                    />
                  ))}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      <AddAssetsPanel mapId={activeMapId} nodes={mapNodes} systems={systems} locations={locations} connections={connections} />
    </div>
  );
}

// --- Draggable Node --------------------------------------------------------
function DraggableNode({ node, label, onDragEnd }: { node: MapNodeView; label: string; onDragEnd: (x: number, y: number) => void }) {
  const [pos, setPos] = useState({ x: node.map_x, y: node.map_y });
  useEffect(() => setPos({ x: node.map_x, y: node.map_y }), [node.map_x, node.map_y]);

  return (
    <motion.div
      className={`absolute z-10 border ${kindColor(node.asset_kind)} shadow-sm rounded-xl`}
      style={{ left: pos.x, top: pos.y, width: 192 }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(e, info) => {
        const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
        const dx = info.point.x - (rect?.left ?? 0);
        const dy = info.point.y - (rect?.top ?? 0);
        const next = { x: Math.max(0, dx - 96), y: Math.max(0, dy - 24) };
        setPos(next);
        onDragEnd(next.x, next.y);
      }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/70 text-[10px] font-semibold uppercase text-neutral-600">
            {node.asset_kind[0]}
          </span>
          <div className="truncate font-medium" title={label}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Add Assets Panel ------------------------------------------------------
function AddAssetsPanel({
  mapId,
  nodes,
  systems,
  locations,
  connections,
}: {
  mapId: string | null;
  nodes: MapNodeView[];
  systems: any[];
  locations: any[];
  connections: any[];
}) {
  const { create: createMapNode } = useMapNodesOrEmpty(mapId);
  const placed = useMemo(() => new Set(nodes.map((n) => `${n.asset_kind}:${n.asset_id}`)), [nodes]);

  const candSystems = useMemo(() => (systems ?? []).filter((s) => !placed.has(`system:${s.id}`)), [systems, placed]);
  const candLocations = useMemo(() => (locations ?? []).filter((l) => !placed.has(`location:${l.id}`)), [locations, placed]);
  const candConnections = useMemo(() => (connections ?? []).filter((c) => !placed.has(`connection:${c.id}`)), [connections, placed]);

  const [selected, setSelected] = useState<{ kind: AssetKind; id: string }[]>([]);

  const toggle = (kind: AssetKind, id: string) =>
    setSelected((arr) =>
      arr.some((x) => x.kind === kind && x.id === id)
        ? arr.filter((x) => !(x.kind === kind && x.id === id))
        : [...arr, { kind, id }]
    );

  const add = () => {
    if (!mapId || selected.length === 0) return;
    // layout in a simple grid near 100,100
    const baseX = 100;
    const baseY = 100;
    const gapX = 220;
    const gapY = 160;
    const rows = selected.map((s, i) => ({
      id: "",
      asset_kind: s.kind,
      asset_id: s.id,
      map_x: baseX + (i % 6) * gapX,
      map_y: baseY + Math.floor(i / 6) * gapY,
      data_version: 1,
      data: {
        label: null
      },
    } as MapNodeView));

    rows.forEach(row => createMapNode.mutate(row))
  };

  return (
    <div className="mt-3 rounded-lg border p-3">
      <div className="mb-2 text-sm font-medium">Add assets to map</div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="mb-1 font-medium">Systems</div>
          <div className="max-h-40 overflow-auto rounded border p-2">
            {candSystems.map((s) => (
              <label key={s.id} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" checked={selected.some((x) => x.kind === "system" && x.id === s.id)} onChange={() => toggle("system", s.id)} />
                <span className="truncate" title={s.name}>{s.name}</span>
              </label>
            ))}
            {candSystems.length === 0 && <div className="text-muted-foreground">No available systems</div>}
          </div>
        </div>
        <div>
          <div className="mb-1 font-medium">Locations</div>
          <div className="max-h-40 overflow-auto rounded border p-2">
            {candLocations.map((l) => (
              <label key={l.id} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" checked={selected.some((x) => x.kind === "location" && x.id === l.id)} onChange={() => toggle("location", l.id)} />
                <span className="truncate" title={l.name}>{l.name}</span>
              </label>
            ))}
            {candLocations.length === 0 && <div className="text-muted-foreground">No available locations</div>}
          </div>
        </div>
        <div>
          <div className="mb-1 font-medium">Connections</div>
          <div className="max-h-40 overflow-auto rounded border p-2">
            {candConnections.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" checked={selected.some((x) => x.kind === "connection" && x.id === c.id)} onChange={() => toggle("connection", c.id)} />
                <span className="truncate" title={c.name}>{c.name}</span>
              </label>
            ))}
            {candConnections.length === 0 && <div className="text-muted-foreground">No available connections</div>}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2">
        <div className="text-xs text-muted-foreground">Selected: {selected.length}</div>
        <Button disabled={!mapId || selected.length === 0 || createMapNode.isPending} onClick={add}>
          Add to map
        </Button>
      </div>
    </div>
  );
}
