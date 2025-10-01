'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ConnectionView, LocationView } from '@/lib/browser/isms/assetTypes';
import { useConnections } from '@/app/_hooks/useConnections';
import LinkedAssetSection from '../_components/LinkedAssetsSection';
import { useLocations } from '@/app/_hooks/useLocations';
import { useConnectionLocations } from '@/app/_hooks/useConnectionLocations';

export default function ConnectionsPage() {
  const connections = useConnections();
  const locations = useLocations();

  return (
    <AssetPageScaffold<ConnectionView>
      hooks={{ ...connections }}
      rows={{
        assetTypeName: 'Connection',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (connection) => (
          <LinkedAssetSection<LocationView>
            className="col-span-full mt-3"
            parentId={connection.id}
            itemTypeName="Location"
            linkHooks={{ ...useConnectionLocations(connection.id) }}
            assetHooks={{ ...locations }}
          />
        )
      }}
    />
  );
}
