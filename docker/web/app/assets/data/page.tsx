//app/assets/data/page.tsx
//Description: display, manage Data. custom display and editor adding category
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import OwnedAssetEditorRow from "../_components/OwnedAssetEditorRow";
import OwnedAssetCreateForm from "../_components/OwnedAssetCreateForm";
import type { DataAssetView, OwnershipView } from "@/lib/browser/isms/assetTypes";
import { useData, useDataCategories } from "@/app/_hooks/useAssets";
import { useMemo } from "react";

function DataDisplayRow(props: {
  value: DataAssetView;
  expanded?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  const { value, expanded, onEdit, onToggle } = props;
  return (
    <SimpleAssetDisplayRow
      value={value}
      expanded={expanded}
      onEdit={onEdit}
      onToggle={onToggle}
      extraInfo={{ name: "Category", value: value.category?.name ?? null }}
    />
  );
}

function DataEditorRow(props: {
  value: DataAssetView;
  owners: OwnershipView[];
  disabled?: boolean;
  onChange: (draft: DataAssetView) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { list } = useDataCategories();
  const categories = useMemo(() => list.data ?? [], [list.data]);

  return (
    <OwnedAssetEditorRow<DataAssetView>
      value={props.value}
      owners={props.owners}
      disabled={props.disabled}
      onChange={props.onChange}
      onSave={props.onSave}
      onDelete={props.onDelete}
      onCancel={props.onCancel}
      extraEditor={
        <div>
          <label
            className="text-sm text-neutral-700 mb-1"
            htmlFor={`category-${props.value.id}`}
          >
            Category
          </label>
          <select
            id={`category-${props.value.id}`}
            className="border rounded-lg px-3 py-2"
            value={props.value.category?.id ?? ""}
            onChange={(event) =>
              props.onChange({
                ...props.value,
                category: categories.find((item) => item.id === event.target.value) ?? null,
              })
            }
            disabled={props.disabled}
          >
            <option value="">No location</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
}

export default function DataAssetsPage() {
  const data = useData();

  return (
    <AssetPageScaffold<DataAssetView>
      hooks={{ ...data }}
      rows={{
        assetTypeName: "Data",
        DisplayRow: DataDisplayRow as any,
        EditorRow: DataEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
      }}
    />
  );
}
