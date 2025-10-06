//app/maps/page.tsx
"use client";

import AssetPageScaffold from "../assets/_scaffold/AssetPageScaffold";
import OwnedAssetCreateForm from "../assets/_components/OwnedAssetCreateForm";
import { useMaps } from "../_hooks/useMaps";
import OwnedAssetDisplayRow from "../assets/_components/OwnedAssetDisplayRow";
import OwnedAssetEditorRow from "../assets/_components/OwnedAssetEditorRow";
import { MapView } from "@/lib/browser/isms/assetTypes";

export default function MapsPage() {
  const maps = useMaps();

  return (
    <AssetPageScaffold<MapView>
      hooks={{ ...maps }}
      rows={{
        assetTypeName: "Map",
        DisplayRow: OwnedAssetDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
      }}
    />
  );
}
