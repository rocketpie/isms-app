//app/assets/systems/page.tsx
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../_components/SimpleAssetEditorRow";
import SimpleAssetCreateForm from "../_components/SimpleAssetCreateForm";
import type { DataAssetView, SystemView } from "@/lib/browser/isms/assetTypes";
import { useSystems } from "@/app/_hooks/useAssets";
import LinkedAssetSection from "../_components/LinkedAssetsSection";
import { useSystemData } from "@/app/_hooks/useAssetLinks";

export default function SystemsPage() {
  const systems = useSystems();

  return (
    <AssetPageScaffold<SystemView>
      hooks={{ ...systems }}
      rows={{
        assetTypeName: "System",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (system) => (
          <LinkedAssetSection<DataAssetView>
            className="col-span-full mt-3"
            parentId={system.id}
            itemTypeName="Data"
            linkHookFactory={useSystemData}
          />
        ),
      }}
    />
  );
}
