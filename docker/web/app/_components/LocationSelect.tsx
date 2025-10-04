// app/_components/locationSelect.tsx
//Description: dropdown select location from useLocations
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
      {locations.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
