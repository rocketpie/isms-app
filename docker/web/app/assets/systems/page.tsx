'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { LocationView } from '@/lib/browser/isms/assetTypes';
import { useSystems } from '@/app/_hooks/useSystems';
import { LinkedDataSection } from './components/LinkedDataSection';

export default function LocationsPage() {
  const hooks = useSystems();
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
        ExpandedView: (system) => (
          <div className="col-span-full mt-3">
            <LinkedDataSection systemId={system.id} />
          </div>
        )
      }}
    />
  );
}
