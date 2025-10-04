//Description: dropdown select data category from useDataCategories
"use client";

import { DataCategoryView } from "@/lib/browser/isms/assetTypes";
import { useDataCategories } from "../_hooks/useAssets";
import { useMemo } from "react";


export default function DataCategorySelect({
  value,
  onChange,
  disabled,
}: {
  value: DataCategoryView | null;
  onChange: (value: DataCategoryView | null) => void;
  disabled?: boolean;
}) {
  const { list } = useDataCategories();
  const categories = useMemo(() => list.data ?? [], [list.data]);

  return (
    <select
      className="border rounded-lg p-2"
      value={value?.id ?? ""}
      disabled={disabled || list.isLoading}
      onChange={(e) => {
        const id = e.target.value || null;
        const picked = categories.find((c) => c.id === id) ?? null;
        onChange(picked);
      }}
    >
      <option value="">uncategorized</option>
      {categories?.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}
