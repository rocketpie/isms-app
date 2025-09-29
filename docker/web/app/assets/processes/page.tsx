// app/assets/processes/page.tsx
'use client';
import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import { useProcesses } from '@/app/_hooks/useProcesses';
import { LinkedApplicationsSection } from './components/LinkedApplicationsSection';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ProcessView } from '@/lib/browser/isms/assetTypes';

export default function ProcessesPage() {
  const hooks = useProcesses();
  return (
    <AssetPageScaffold<ProcessView>
      hooks={{
        list: hooks.list,
        create: hooks.create,
        update: hooks.update,
        remove: hooks.remove
      }}
      rows={{
        assetTypeName: 'Process',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (p) => (
          <div className="col-span-full mt-3">
            <LinkedApplicationsSection processId={p.id} />
          </div>
        )
      }}
    />
  );
}
