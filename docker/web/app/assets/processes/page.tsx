//app/assets/processes/page.tsx
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import { useProcesses } from "@/app/_hooks/useProcesses";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../_components/SimpleAssetEditorRow";
import SimpleAssetCreateForm from "../_components/SimpleAssetCreateForm";
import type {
  ApplicationView,
  ProcessView,
} from "@/lib/browser/isms/assetTypes";
import { useApplications } from "@/app/_hooks/useApplications";
import { useProcessApplications } from "@/app/_hooks/useProcessApplications";
import LinkedAssetSection from "../_components/LinkedAssetsSection";

export default function ProcessesPage() {
  const processes = useProcesses();
  const applications = useApplications();

  return (
    <AssetPageScaffold<ProcessView>
      hooks={{ ...processes }}
      rows={{
        assetTypeName: "Process",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (process) => (
          <LinkedAssetSection<ApplicationView>
            className="col-span-full mt-3"
            parentId={process.id}
            itemTypeName="Application"
            linkHooks={{ ...useProcessApplications(process.id) }}
            assetHooks={{ ...applications }}
          />
        ),
      }}
    />
  );
}
