//app/assets/data/page.tsx
//Description: display, manage Data assets
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../_components/SimpleAssetEditorRow";
import SimpleAssetCreateForm from "../_components/SimpleAssetCreateForm";
import type { DataAssetView } from "@/lib/browser/isms/assetTypes";
import { useData } from "@/app/_hooks/useAssets";

export default function DataAssetsPage() {
  const data = useData();

  return (
    <AssetPageScaffold<DataAssetView>
      hooks={{ ...data }}
      rows={{
        assetTypeName: "Data",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
      }}
    />
  );
}
