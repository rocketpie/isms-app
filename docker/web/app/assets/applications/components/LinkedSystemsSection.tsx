//app/assets/applications/components/LinkedSystemsSection.tsx
'use client'

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown } from 'lucide-react';

import { listOwnerships } from '@/lib/browser/isms/ownership';
import { SystemView, listSystems } from '@/lib/browser/isms/systems';
import { ApplicationSystemView, listLinkedSystems, linkSystem, unlinkSystem } from '@/lib/browser/isms/application-systems';

import { queryKeys } from '@/app/_hooks/queryKeys';
import { useSystems } from '@/app/_hooks/useSystems';

import { SystemDisplayRow } from '@/app/assets/systems/components/SystemDisplayRow';
import { SystemEditorRow } from '@/app/assets/systems/components/SystemEditorRow';
import SystemCreateForm from '@/app/assets/systems/components/SystemCreateForm';

export function LinkedSystemsSection({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const { update, remove } = useSystems(); // reuse app mutations for inline edit / optional delete

  // Linked to this process
  const linkedQuery = useQuery({
    queryKey: queryKeys.applicationSystems(applicationId),
    queryFn: () => listLinkedSystems(applicationId),
  });

  // All applications (exclude already-linked)
  const allSystemsQuery = useQuery({
    queryKey: queryKeys.allSystems,
    queryFn: listSystems,
    staleTime: 30_000,
  });

  // Owners for editor + create form
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships });

  // Optimistic link
  const linkMutation = useMutation({
    mutationFn: ({ systemId }: { systemId: string }) => linkSystem(applicationId, systemId),
    onMutate: async ({ systemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const previous = queryClient.getQueryData<ApplicationSystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      const system = (allSystemsQuery.data || []).find(a => a.id === systemId);
      if (system) {
        queryClient.setQueryData<ApplicationSystemView[]>(
          queryKeys.applicationSystems(applicationId),
          [...previous, { application_id: applicationId, system_id: system.id, system: system }]
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  // Optimistic unlink
  const unlinkMutation = useMutation({
    mutationFn: ({ systemId }: { systemId: string }) => unlinkSystem(applicationId, systemId),
    onMutate: async ({ systemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
      const previous = queryClient.getQueryData<ApplicationSystemView[]>(queryKeys.applicationSystems(applicationId)) || [];
      queryClient.setQueryData<ApplicationSystemView[]>(
        queryKeys.applicationSystems(applicationId),
        previous.filter(x => x.system_id !== systemId)
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.applicationSystems(applicationId), ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
    },
  });

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerValue, setPickerValue] = useState<string>('');
  const [editing, setEditing] = useState<Record<string, SystemView>>({}); // id -> draft

  // Compute available applications to link
  const linkedIds = new Set((linkedQuery.data || []).map(x => x.system_id));
  const availableSystems = (allSystemsQuery.data || [])
    .filter(item => !linkedIds.has(item.id)) // exclude already-linked
    .filter(item => (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)); // apply search filter

  return (
    <div className="mt-3 rounded-xl border bg-white p-3">
      <h4 className="font-medium mb-2">Systems</h4>

      {/* Linked list */}
      {linkedQuery.isLoading && <p>Loading linked…</p>}
      {linkedQuery.error && <p className="text-sm text-red-600">{(linkedQuery.error as Error).message}</p>}

      <ul className="grid gap-2">
        {(linkedQuery.data || []).map(link => {
          const item = link.system;
          if (!item) return null; // defensive

          const isEditing = editing[item.id] !== undefined;
          const value = isEditing ? editing[item.id] : item;

          return (
            <li key={link.system_id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {isEditing ? (
                    <SystemEditorRow
                      value={value}
                      owners={ownersQuery.data || []}
                      disabled={update.isPending || remove.isPending}
                      onChange={draft => setEditing(prev => ({ ...prev, [item.id]: draft }))}
                      onSave={() => {
                        const patch: Partial<SystemView> = {
                          name: value.name.trim(),
                          description: value.description?.trim() || null,
                          owner: value.owner || null,
                        };
                        update.mutate({ id: item.id, patch });
                        setEditing(({ [item.id]: _omit, ...rest }) => rest);
                      }}
                      onDelete={() => {
                        const ok = confirm(
                          'Delete this application?\n\nNote: related junctions may cascade delete depending on FK policy.'
                        );
                        if (ok) remove.mutate(item.id);
                      }}
                      onCancel={() => setEditing(({ [item.id]: _omit, ...rest }) => rest)}
                    />
                  ) : (
                    <SystemDisplayRow
                      listItem={item}
                      expanded={false}
                      onEdit={() => setEditing(prev => ({ ...prev, [item.id]: item }))}
                    />
                  )}
                </div>
                <button
                  className="rounded-lg px-3 py-1 border text-red-600 disabled:opacity-60"
                  disabled={unlinkMutation.isPending}
                  onClick={() => unlinkMutation.mutate({ systemId: link.system_id })}
                  title="Remove link"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
        {(linkedQuery.data || []).length === 0 && (
          <li className="text-sm text-neutral-500">No linked applications.</li>
        )}
      </ul>

      {/* Add existing */}
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Search applications…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 md:col-span-2"
          value={pickerValue}
          onChange={e => setPickerValue(e.target.value)}
          disabled={allSystemsQuery.isLoading}
        >
          <option value="">Add existing…</option>
          {availableSystems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={!pickerValue || linkMutation.isPending}
          onClick={() => linkMutation.mutate({ systemId: pickerValue })}
        >
          Link system
        </button>
      </div>

      {/* Create new + auto-link (reusing the shared form) */}
      <details className="group mt-2">
        <summary className="flex items-center gap-2 text-sm text-neutral-700">
          <ChevronRight className="h-4 w-4 group-open:hidden" />
          <ChevronDown className="h-4 w-4 hidden group-open:block" />
          <span>link a new system</span>
        </summary>
        <SystemCreateForm
          owners={ownersQuery.data || []}
          className="mt-4"
          onCreated={(created) => {
            linkSystem(applicationId, created.id)
              .finally(() => {
                queryClient.invalidateQueries({ queryKey: queryKeys.applicationSystems(applicationId) });
                queryClient.invalidateQueries({ queryKey: queryKeys.allSystems });
              });
          }}
        />
      </details>

    </div>
  );
}
