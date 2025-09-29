'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { DataAssetView } from '@/lib/browser/isms/assetTypes';
import { useData } from '@/app/_hooks/useData';

export default function DataAssetsPage() {
  const hooks = useData();
  return (
    <AssetPageScaffold<DataAssetView>
      hooks={{
        list: hooks.list,
        create: hooks.create,
        update: hooks.update,
        remove: hooks.remove
      }}
      rows={{
        assetTypeName: 'Data Asset',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        // e.g. later: <LinkedApplicationsForData dataAssetId={d.id} />
        ExpandedView: () => null
      }}
    />
  );
}
