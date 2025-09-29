'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { LocationView } from '@/lib/browser/isms/assetTypes';
import { useLocations } from '@/app/_hooks/useLocations';
import { LinkedConnectionsSection } from './components/LinkedConnectionsSection';

export default function LocationsPage() {
  const hooks = useLocations();
  return (
    <AssetPageScaffold<LocationView>
      hooks={{
        list: hooks.list,
        create: hooks.create,
        update: hooks.update,
        remove: hooks.remove
      }}
      rows={{
        assetTypeName: 'Location',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        // Add a domain-specific details panel when ready
        ExpandedView: (location) => (
          <div className="col-span-full mt-3">
            <LinkedConnectionsSection locationId={location.id} />
          </div>
        )
      }}
    />
  );
}
