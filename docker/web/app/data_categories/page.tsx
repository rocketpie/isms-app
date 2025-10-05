//app/assets/data/page.tsx
//Description: display, manage Data. custom display and editor adding category
"use client";

import { useDataCategories } from "@/app/_hooks/useAssets";
import { DataCategoryView } from "@/lib/browser/isms/assetTypes";
import SimpleAssetCreateForm from "../assets/_components/SimpleAssetCreateForm";
import SimpleAssetDisplayRow from "../assets/_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../assets/_components/SimpleAssetEditorRow";
import AssetPageScaffold from "../assets/_scaffold/AssetPageScaffold";

export default function DataAssetsPage() {
  const categories = useDataCategories();

  return (
    <AssetPageScaffold<DataCategoryView>
      hooks={{ ...categories }}
      rows={{
        assetTypeName: "Data Category",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
      }}
    />
  );
}
