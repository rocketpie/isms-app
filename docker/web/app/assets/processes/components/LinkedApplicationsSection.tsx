//app/assets/processes/components/LinkedApplicationsSection.tsx
'use client'

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { listOwnerships } from '@/lib/browser/isms/ownership';
import { ProcessApplicationView, listLinkedApplications, linkApplication, unlinkApplication, } from '@/lib/browser/isms/process-applications';

import { queryKeys } from '@/app/_hooks/queryKeys';
import { useApplications } from '@/app/_hooks/useApplications';

import { createApplication, listApplications } from '@/lib/browser/isms/applications';
import { ApplicationView } from '@/lib/browser/isms/assetTypes';
import SimpleAssetDisplayRow from '../../_components/SimpleAssetDisplayRow';
import SimpleAssetEditorRow from '../../_components/SimpleAssetEditorRow';
import SimpleAssetCreateForm from '../../_components/SimpleAssetCreateForm';

export function LinkedApplicationsSection({ processId }: { processId: string }) {
  const queryClient = useQueryClient();
  const { update, remove } = useApplications(); // reuse app mutations for inline edit / optional delete

  // Linked to this process
  const linkedQuery = useQuery({
    queryKey: queryKeys.processApplications(processId),
    queryFn: () => listLinkedApplications(processId),
  });

  // All applications (exclude already-linked)
  const allAppsQuery = useQuery({
    queryKey: queryKeys.allApplications,
    queryFn: listApplications,
    staleTime: 30_000,
  });

  // Owners for editor + create form
  const ownersQuery = useQuery({ queryKey: queryKeys.allOwnership, queryFn: listOwnerships });

  // Optimistic link
  const linkMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => linkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.processApplications(processId) });
      const previous = queryClient.getQueryData<ProcessApplicationView[]>(queryKeys.processApplications(processId)) || [];
      const app = (allAppsQuery.data || []).find(a => a.id === applicationId);
      if (app) {
        queryClient.setQueryData<ProcessApplicationView[]>(
          queryKeys.processApplications(processId),
          [...previous, { process_id: processId, application_id: app.id, application: app }]
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.processApplications(processId), ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
    },
  });

  // Optimistic unlink
  const unlinkMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => unlinkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.processApplications(processId) });
      const previous = queryClient.getQueryData<ProcessApplicationView[]>(queryKeys.processApplications(processId)) || [];
      queryClient.setQueryData<ProcessApplicationView[]>(
        queryKeys.processApplications(processId),
        previous.filter(x => x.application_id !== applicationId)
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.processApplications(processId), ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
    },
  });

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerValue, setPickerValue] = useState<string>('');
  const [editing, setEditing] = useState<Record<string, ApplicationView>>({}); // id -> draft

  // Compute available applications to link
  const linkedIds = new Set((linkedQuery.data || []).map(x => x.application_id));
  const availableApps = (allAppsQuery.data || [])
    .filter(item => !linkedIds.has(item.id)) // exclude already-linked
    .filter(item => (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)); // apply search filter

  return (
    <div className="mt-3 rounded-xl border bg-white p-3">
      <h4 className="font-medium mb-2">Applications</h4>

      {/* Linked list */}
      {linkedQuery.isLoading && <p>Loading linked…</p>}
      {linkedQuery.error && <p className="text-sm text-red-600">{(linkedQuery.error as Error).message}</p>}

      <ul className="grid gap-2">
        {(linkedQuery.data || []).map(link => {
          const item = link.application;
          if (!item) return null; // defensive

          const isEditing = editing[item.id] !== undefined;
          const value = isEditing ? editing[item.id] : item;

          return (
            <li key={link.application_id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  {isEditing ? (
                    <SimpleAssetEditorRow
                      value={value}
                      owners={ownersQuery.data || []}
                      disabled={update.isPending || remove.isPending}
                      onChange={draft => setEditing(prev => ({ ...prev, [item.id]: draft }))}
                      onSave={() => {
                        update.mutate({ id: item.id, patch: value });
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
                    <SimpleAssetDisplayRow
                      value={item}
                      expanded={false}
                      onEdit={() => setEditing(prev => ({ ...prev, [item.id]: item }))}
                    />
                  )}
                </div>
                <button
                  className="rounded-lg px-3 py-1 border text-red-600 disabled:opacity-60"
                  disabled={unlinkMutation.isPending}
                  onClick={() => unlinkMutation.mutate({ applicationId: link.application_id })}
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
          disabled={allAppsQuery.isLoading}
        >
          <option value="">Add existing…</option>
          {availableApps.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={!pickerValue || linkMutation.isPending}
          onClick={() => linkMutation.mutate({ applicationId: pickerValue })}
        >
          Link application
        </button>
      </div>

      {/* Create new + auto-link (reusing the shared form) */}
      <details className="group mt-2">
        <summary className="flex items-center gap-2 text-sm text-neutral-700">
          <ChevronRight className="h-4 w-4 group-open:hidden" />
          <ChevronDown className="h-4 w-4 hidden group-open:block" />
          <span>link a new application</span>
        </summary>
        <SimpleAssetCreateForm
          owners={ownersQuery.data || []}
          className="mt-4"
          onSubmit={newApplication =>
            createApplication({ ...newApplication })
              .then(created => {
                linkApplication(processId, created.id)
                  .finally(() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.processApplications(processId) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.allApplications });
                  });
              })
          }
        />
      </details>

    </div>
  );
}
