'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import { useApplications } from '@/app/_hooks/useApplications';
import { LinkedSystemsSection } from './components/LinkedSystemsSection';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ApplicationView } from '@/lib/browser/isms/assetTypes';

export default function ApplicationsPage() {
  const hooks = useApplications();
  return (
    <AssetPageScaffold<ApplicationView>
      hooks={{
        list: hooks.list,
        create: hooks.create,
        update: hooks.update,
        remove: hooks.remove
      }}
      rows={{
        assetTypeName: 'Application',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (a) => (
          <div className="col-span-full mt-3">
            <LinkedSystemsSection applicationId={a.id} />
          </div>
        )
      }}
    />
  );
}
