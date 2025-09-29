'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ConnectionView } from '@/lib/browser/isms/assetTypes';
import { useConnections } from '@/app/_hooks/useConnections';

export default function ConnectionsPage() {
  const hooks = useConnections();
  return (
    <AssetPageScaffold<ConnectionView>
      hooks={{
        list: hooks.list,
        create: hooks.create,
        update: hooks.update,
        remove: hooks.remove
      }}
      rows={{
        assetTypeName: 'Connection',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        // e.g. later: <LinkedSystemsForConnection connectionId={c.id} />
        ExpandedView: () => null
      }}
    />
  );
}
