//app/maps/editor/page.tsx
"use client";

// Simple map editor launcher: shows a map selector, then renders the MapEditor once a map is chosen

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMaps } from "@/app/_hooks/useMaps";
import MapEditor from "@/app/maps/components/mapEditor";

export default function MapEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const { list } = useMaps();
  const maps = useMemo(() => list.data ?? [], [list.data]);

  const [mapId, setMapId] = useState<string | null>(initialId);

  // Auto-pick first map if none selected
  useEffect(() => {
    if (!mapId && maps.length > 0) {
      const first = maps[0].id as string;
      setMapId(first);
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set("id", first);
      router.replace(`/maps/editor?${sp.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps.length, mapId]);

  const onSelect = (nextId: string) => {
    setMapId(nextId || null);
    const sp = new URLSearchParams(searchParams?.toString());
    if (nextId) sp.set("id", nextId); else sp.delete("id");
    router.replace(`/maps/editor${sp.size ? `?${sp.toString()}` : ""}`);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Map Editor</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">Map</label>
          <select
            className="rounded-md border px-2 py-1 text-sm min-w-64"
            value={mapId ?? ""}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Select a map…</option>
            {maps.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Link href="/assets/maps">
            <Button size="sm" variant="secondary">Manage maps</Button>
          </Link>
        </div>
      </header>

      {!mapId ? (
        <div className="text-sm text-muted-foreground">Choose a map from the dropdown to start editing.</div>
      ) : (
        <MapEditor mapId={mapId} />
      )}
    </div>
  );
}
