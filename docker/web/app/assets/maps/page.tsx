//app/maps/page.tsx
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import OwnedAssetCreateForm from "../_components/OwnedAssetCreateForm";
import { useMaps } from "../../_hooks/useMaps";
import OwnedAssetDisplayRow from "../_components/OwnedAssetDisplayRow";
import OwnedAssetEditorRow from "../_components/OwnedAssetEditorRow";
import { MapKind, mapKinds, MapView, OwnershipView } from "@/lib/browser/isms/assetTypes";
import { useState } from "react";

function MapDisplayRow(props: {
  value: MapView;
  expanded?: boolean;
  onEdit?: () => void;
  onToggle?: () => void;
}) {
  const { value, expanded, onEdit, onToggle } = props;
  return (
    <OwnedAssetDisplayRow
      value={value}
      expanded={expanded}
      onEdit={onEdit}
      onToggle={onToggle}
      extraInfo={{ name: "map type", value: value.map_kind ?? null }}
    />
  );
}

function MapCreateForm(props: {
  className?: string;
  /* e.g., "Application" */
  assetTypeName?: string;
  /** Optional pre-fetched owners to skip the owners query */
  owners?: OwnershipView[];
  /** Called with the new Asset */
  onSubmit: (newAsset: MapView) => Promise<any>;
}) {
  const [mapKind, setMapKind] = useState<MapKind>("");
  return (
    <OwnedAssetCreateForm<MapView>
      className={props.className}
      assetTypeName="Map"
      owners={props.owners}
      onSubmit={(newAsset: MapView) => {
        if (!mapKind) {
          return Promise.reject(new Error("choose a map type"));
        }
        newAsset.map_kind = mapKind
        return props.onSubmit(newAsset)
      }}
      extraEditor={
        <div>
          <label
            className="text-sm text-neutral-700 mb-1"
            htmlFor="create-owner"
          >
            Map Type
          </label>
          <select
            id="create-owner"
            className="border rounded-lg px-3 py-2"
            value={mapKind}
            onChange={(event) => setMapKind(event.target.value)}
          >
            <option value="">choose a map type:</option>
            {mapKinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      }
    />
  )
}

export default function MapsPage() {
  const maps = useMaps();

  return (
    <AssetPageScaffold<MapView>
      hooks={{ ...maps }}
      rows={{
        assetTypeName: "Map",
        DisplayRow: MapDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: MapCreateForm as any,
      }}
    />
  );
}
