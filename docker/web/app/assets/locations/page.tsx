'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ConnectionView, LocationView } from '@/lib/browser/isms/assetTypes';
import { useLocations } from '@/app/_hooks/useLocations';
import { useLocationConnections } from '@/app/_hooks/useLocationConnections';
import LinkedAssetSection from '../_components/LinkedAssetsSection';
import { useConnections } from '@/app/_hooks/useConnections';

export default function LocationsPage() {
  const locations = useLocations();
  const connections = useConnections();

  return (
    <AssetPageScaffold<LocationView>
      hooks={{ ...locations }}
      rows={{
        assetTypeName: 'Location',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (location) => (
          <LinkedAssetSection<ConnectionView>
            className="col-span-full mt-3"
            parentId={location.id}
            itemTypeName="Connection"
            linkHooks={{ ...useLocationConnections(location.id) }}
            assetHooks={{ ...connections }}
          />
        )
      }}
    />
  );
}
