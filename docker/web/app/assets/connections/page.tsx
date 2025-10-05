//app/assets/connections/page.tsx
//Description: display, manage Connection assets
"use client";

import AssetPageScaffold from "../_scaffold/AssetPageScaffold";
import OwnedAssetDisplayRow from "../_components/OwnedAssetDisplayRow";
import OwnedAssetEditorRow from "../_components/OwnedAssetEditorRow";
import OwnedAssetCreateForm from "../_components/OwnedAssetCreateForm";
import type {
  ConnectionView,
  LocationView,
} from "@/lib/browser/isms/assetTypes";
import LinkedAssetSection from "../_components/LinkedAssetsSection";
import { useConnections } from "@/app/_hooks/useAssets";
import { useConnectionLocations } from "@/app/_hooks/useAssetLinks";

export default function ConnectionsPage() {
  const connections = useConnections();

  return (
    <AssetPageScaffold<ConnectionView>
      hooks={{ ...connections }}
      rows={{
        assetTypeName: "Connection",
        DisplayRow: OwnedAssetDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
        ExpandedView: (connection) => (
          <LinkedAssetSection<LocationView>
            className="col-span-full mt-3"
            parentId={connection.id}
            itemTypeName="Location"
            linkHookFactory={useConnectionLocations}
          />
        ),
      }}
    />
  );
}
