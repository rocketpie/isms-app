//app/assets/applications/page.tsx
//Description: display, manage Application assets
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import OwnedAssetDisplayRow from "../_components/OwnedAssetDisplayRow";
import OwnedAssetEditorRow from "../_components/OwnedAssetEditorRow";
import OwnedAssetCreateForm from "../_components/OwnedAssetCreateForm";
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
        DisplayRow: OwnedAssetDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
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
