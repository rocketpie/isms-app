//app/assets/applications/page.tsx
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import SimpleAssetDisplayRow from "../_components/SimpleAssetDisplayRow";
import SimpleAssetEditorRow from "../_components/SimpleAssetEditorRow";
import SimpleAssetCreateForm from "../_components/SimpleAssetCreateForm";
import type {
  ApplicationView,
  SystemView,
} from "@/lib/browser/isms/assetTypes";
import LinkedAssetSection from "../_components/LinkedAssetsSection";
import { useApplicationSystems } from "@/app/_hooks/useAssetLinks";
import { useApplications } from "@/app/_hooks/useAssets";

export default function ApplicationsPage() {
  const applications = useApplications();

  return (
    <AssetPageScaffold<ApplicationView>
      hooks={{ ...applications }}
      rows={{
        assetTypeName: "Application",
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (application) => (
          <div className="col-span-full mt-3">
            <LinkedAssetSection<SystemView>
              parentId={application.id}
              itemTypeName="System"
              linkHookFactory={useApplicationSystems}
            />
          </div>
        ),
      }}
    />
  );
}
