//app/assets/processes/page.tsx
//Description: display, manage Process assets
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import OwnedAssetDisplayRow from "../_components/OwnedAssetDisplayRow";
import OwnedAssetEditorRow from "../_components/OwnedAssetEditorRow";
import OwnedAssetCreateForm from "../_components/OwnedAssetCreateForm";
import type {
  ApplicationView,
  ProcessView,
} from "@/lib/browser/isms/assetTypes";
import LinkedAssetSection from "../_components/LinkedAssetsSection";
import { useProcesses } from "@/app/_hooks/useAssets";
import { useProcessApplications } from "@/app/_hooks/useAssetLinks";

export default function ProcessesPage() {
  const processes = useProcesses();

  return (
    <AssetPageScaffold<ProcessView>
      hooks={{ ...processes }}
      rows={{
        assetTypeName: "Process",
        DisplayRow: OwnedAssetDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
        ExpandedView: (process) => (
          <LinkedAssetSection<ApplicationView>
            className="col-span-full mt-3"
            parentId={process.id}
            itemTypeName="Application"
            linkHookFactory={useProcessApplications}
          />
        ),
      }}
    />
  );
}
