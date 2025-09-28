//app/assets/processes/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProcesses } from '@/app/_hooks/useProcesses';
import { queryKeys } from '@/app/_hooks/queryKeys';

import { listOwnerships } from '@/lib/browser/isms/ownership';
import { ProcessView } from '@/lib/browser/isms/processes';

import { ProcessDisplayRow } from './components/ProcessDisplayRow';
import { ProcessEditorRow } from './components/ProcessEditorRow';
import ProcessCreateForm from './components/ProcessCreateForm';
import { LinkedApplicationsSection } from './components/LinkedApplicationsSection';
import SimpleAssetDisplayRow from '../_components/SimpleAssetDisplayRow';

export default function ProcessesPage() {
  const { list: processesQuery, update, remove } = useProcesses();
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships });

  const processes = useMemo(() => processesQuery.data ?? [], [processesQuery.data]);
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);

  // Inline edit state: map of id -> draft ProcessView
  const [editing, setEditing] = useState<Record<string, ProcessView>>({});
  // Expanded rows: map of id -> boolean
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        {(processesQuery.isLoading || ownersQuery.isLoading) && <p>Loading…</p>}
        {(processesQuery.error || ownersQuery.error) && (
          <p className="text-red-600 text-sm">
            {(processesQuery.error as Error)?.message || (ownersQuery.error as Error)?.message}
          </p>
        )}
        {processes.length === 0 && !processesQuery.isLoading && (
          <p className="text-neutral-600">No processes yet.</p>
        )}

        <ul className="grid gap-2">
          {processes.map(listItem => {
            const isEditing = editing[listItem.id] !== undefined;
            const value = isEditing ? editing[listItem.id] : listItem;

            return (
              <li key={listItem.id} className="bg-white border rounded-xl p-3">
                {isEditing ? (
                  <ProcessEditorRow
                    value={value}
                    owners={owners}
                    disabled={update.isPending || remove.isPending}
                    onChange={draft =>
                      setEditing(prev => ({
                        ...prev,
                        [listItem.id]: draft,
                      }))
                    }
                    onSave={() => {
                      const patch: Partial<ProcessView> = {
                        name: value.name.trim(),
                        description: value.description?.trim() || null,
                        owner: value.owner || null,
                      };
                      update.mutate({ id: listItem.id, patch });
                      setEditing(({ [listItem.id]: _omit, ...rest }) => rest);
                    }}
                    onDelete={() => {
                      const ok = confirm(
                        'Delete this process?\n\nNote: related junctions may cascade delete depending on FK policy.'
                      );
                      if (ok) remove.mutate(listItem.id);
                    }}
                    onCancel={() =>
                      setEditing(prev => {
                        const { [listItem.id]: _omit, ...rest } = prev;
                        return rest;
                      })
                    }
                  />
                ) : (
                  <SimpleAssetDisplayRow
                    name={listItem.name}
                    description={listItem.description}
                    ownerName={listItem.owner?.name}
                    expanded={!!expanded[listItem.id]}
                    onToggle={() => setExpanded(prev => ({ ...prev, [listItem.id]: !prev[listItem.id] }))}
                    onEdit={() => setEditing(prev => ({ ...prev, [listItem.id]: listItem }))}
                  />
                )}

                {!isEditing && expanded[listItem.id] && (
                  <div className="col-span-full mt-3">
                    <LinkedApplicationsSection processId={listItem.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <ProcessCreateForm
        owners={owners}
        className="bg-white border rounded-2xl p-4" />
    </div>
  );
}
