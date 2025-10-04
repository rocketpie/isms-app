// app/_components/locationSelect.tsx
//Description: A dropdown select component for choosing a location from a list fetched via a custom hook.
"use client";

import { LocationView } from "@/lib/browser/isms/assetTypes";
import { useLocations } from "../_hooks/useAssets";
import { useMemo } from "react";


export function LocationSelect({
  value,
  onChange,
  disabled,
}: {
  value: LocationView | null;
  onChange: (value: LocationView | null) => void;
  disabled?: boolean;
}) {
  const { list } = useLocations();
  const locations = useMemo(() => list.data ?? [], [list.data]);

  return (
    <select
      className="border rounded-lg p-2"
      value={value?.id ?? ""}
      disabled={disabled || list.isLoading}
      onChange={(e) => {
        const id = e.target.value || null;
        const picked = locations.find((l) => l.id === id) ?? null;
        onChange(picked);
      }}
    >
      <option value="">No location</option>
      {locations.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
}
