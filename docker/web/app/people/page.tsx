//app/people/page.tsx
//Description: display, manage People
"use client";

import { DataCategoryView } from "@/lib/browser/isms/assetTypes";
import { usePeople } from "@/app/_hooks/useAssets";
import SimpleAssetCreateForm from "../assets/_components/SimpleAssetCreateForm";
import SimpleAssetDisplayRow from "../assets/_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../assets/_components/SimpleAssetEditorRow";
import AssetPageScaffold from "../assets/_scaffold/AssetPageScaffold";

export default function PeoplePage() {
  const people = usePeople();

  return (
    <AssetPageScaffold<DataCategoryView>
      hooks={{ ...people }}
      rows={{
        assetTypeName: "Person",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
      }}
    />
  );
}
