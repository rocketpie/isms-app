'use client';

import AssetPageScaffold from '../_scaffold/AssetPageScaffold';
import { useApplications } from '@/app/_hooks/useApplications';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../_components/SimpleAssetCreateForm';
import type { ApplicationView, SystemView } from '@/lib/browser/isms/assetTypes';
import { useApplicationSystems } from '@/app/_hooks/useApplicationSystems';
import { useSystems } from '@/app/_hooks/useSystems';
import LinkedAssetSection from '../_components/LinkedAssetsSection';

export default function ApplicationsPage() {
  const applications = useApplications();
  const systems = useSystems();

  return (
    <AssetPageScaffold<ApplicationView>
      hooks={{ ...applications }}
      rows={{
        assetTypeName: 'Application',
        DisplayRow: SimpleAssetDisplayRow as any,
        EditorRow: SimpleAssetEditorRow as any,
        CreateForm: SimpleAssetCreateForm as any,
        ExpandedView: (application) => (
          <div className="col-span-full mt-3">
            <LinkedAssetSection<SystemView>
              parentId={application.id}
              itemTypeName="System"
              linkHooks={{ ...useApplicationSystems(application.id) }}
              assetHooks={{ ...systems }}
            />
          </div>
        )
      }}
    />
  );
}
