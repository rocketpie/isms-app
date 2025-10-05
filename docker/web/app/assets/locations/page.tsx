//app/assets/locations/page.tsx
//Description: display, manage Location assets
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
import { useLocations } from "@/app/_hooks/useAssets";
import { useLocationConnections } from "@/app/_hooks/useAssetLinks";

export default function LocationsPage() {
  const locations = useLocations();

  return (
    <AssetPageScaffold<LocationView>
      hooks={{ ...locations }}
      rows={{
        assetTypeName: "Location",
        DisplayRow: OwnedAssetDisplayRow as any,
        EditorRow: OwnedAssetEditorRow as any,
        CreateForm: OwnedAssetCreateForm as any,
        ExpandedView: (location) => (
          <LinkedAssetSection<ConnectionView>
            className="col-span-full mt-3"
            parentId={location.id}
            itemTypeName="Connection"
            linkHookFactory={useLocationConnections}
          />
        ),
      }}
    />
  );
}
