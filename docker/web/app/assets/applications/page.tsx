//app/applications/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApplications } from '@/app/_hooks/useApplications';
import { queryKeys } from '@/app/_hooks/queryKeys';

import { listOwnerships } from '@/lib/browser/isms/ownership';
import { ApplicationView } from '@/lib/browser/isms/applications';

import { ApplicationDisplayRow } from './components/ApplicationDisplayRow';
import { ApplicationEditorRow } from './components/ApplicationEditorRow';
import { LinkedSystemsSection } from './components/LinkedSystemsSection';
import ApplicationCreateForm from './components/ApplicationCreateForm';

export default function ApplicationsPage() {
  const { list: appsQuery, update, remove } = useApplications();
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships });

  const applications = useMemo(() => appsQuery.data ?? [], [appsQuery.data]);
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);

  // Inline edit state: map of id -> draft ProcessView
  const [editing, setEditing] = useState<Record<string, ApplicationView>>({});
  // Expanded rows: map of id -> boolean
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        {(appsQuery.isLoading || ownersQuery.isLoading) && <p>Loading…</p>}
        {(appsQuery.error || ownersQuery.error) && (
          <p className="text-red-600 text-sm">
            {(appsQuery.error as Error)?.message || (ownersQuery.error as Error)?.message}
          </p>
        )}
        {applications.length === 0 && !appsQuery.isLoading && (
          <p className="text-neutral-600">No applications yet.</p>
        )}

        <ul className="grid gap-2">
          {applications.map(listItem => {
            const isEditing = editing[listItem.id] !== undefined;
            const value = isEditing ? editing[listItem.id] : listItem;

            return (
              <li key={listItem.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <ApplicationEditorRow
                    value={value}
                    owners={owners}
                    disabled={update.isPending || remove.isPending}
                    onChange={draft =>
                      setEditing(prev => ({ ...prev, [listItem.id]: draft }))
                    }
                    onSave={() => {
                      const patch: Partial<ApplicationView> = {
                        name: value.name.trim(),
                        description: value.description?.trim() || null,
                        owner: value.owner || null,
                      };
                      update.mutate({ id: listItem.id, patch });
                      setEditing(({ [listItem.id]: _omit, ...rest }) => rest);
                    }}
                    onDelete={() => {
                      const ok = confirm(
                        'Delete this application?\n\nNote: related junctions may cascade delete depending on FK policy.'
                      );
                      if (ok) remove.mutate(listItem.id);
                    }}
                    onCancel={() => setEditing(({ [listItem.id]: _omit, ...rest }) => rest)}
                  />
                ) : (
                  <ApplicationDisplayRow
                    listItem={listItem}
                    expanded={!!expanded[listItem.id]}
                    onToggle={() => setExpanded(prev => ({ ...prev, [listItem.id]: !prev[listItem.id] }))}
                    onEdit={() => setEditing(prev => ({ ...prev, [listItem.id]: listItem }))}
                  />
                )}

                {!isEditing && expanded[listItem.id] && (
                  <div className="col-span-full mt-3">
                    <LinkedSystemsSection applicationId={listItem.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <ApplicationCreateForm
        owners={owners}
        className="bg-white border rounded-2xl p-4" />
    </div>
  );
}
