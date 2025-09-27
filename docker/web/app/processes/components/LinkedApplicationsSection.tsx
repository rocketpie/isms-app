import { postgrest } from "@/lib/browser/api-isms";
import { ApplicationView, listApplications } from "@/lib/browser/isms/applications";
import { listOwnerships } from "@/lib/browser/isms/ownership";
import { linkApplication, listLinkedApplications, ProcessApplicationView, unlinkApplication } from "@/lib/browser/isms/process-applications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";


export function LinkedApplicationsSection({ processId }: { processId: string }) {
  const queryClient = useQueryClient();

  // linked for this process
  const linkedQ = useQuery({
    queryKey: ['process', processId, 'applications'],
    queryFn: () => listLinkedApplications(processId),
  });

  // all apps (we'll exclude ones already linked to this process)
  const allAppsQ = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: listApplications,
    staleTime: 30_000,
  });

  const linkMut = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      linkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: ['process', processId, 'applications'] });
      const prev = queryClient.getQueryData<ProcessApplicationView[]>([
        'process',
        processId,
        'applications',
      ]) || [];
      const app = (allAppsQ.data || []).find(a => a.id === applicationId);
      if (app) {
        queryClient.setQueryData<ProcessApplicationView[]>(
          ['process', processId, 'applications'],
          [...prev, { process_id: processId, application_id: app.id, application: app }]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['process', processId, 'applications'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['process', processId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'all'] });
    },
  });

  const unlinkMut = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      unlinkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey: ['process', processId, 'applications'] });
      const prev = queryClient.getQueryData<ProcessApplicationView[]>([
        'process',
        processId,
        'applications',
      ]) || [];
      queryClient.setQueryData<ProcessApplicationView[]>(
        ['process', processId, 'applications'],
        prev.filter(x => x.application_id !== applicationId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['process', processId, 'applications'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['process', processId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'all'] });
    },
  });

  // create + auto-link
  const createApp = useMutation({
    mutationFn: async (input: { name: string; description: string | null; ownerId: string | null }) => {
      const body = [{ name: input.name, description: input.description, owner_id: input.ownerId }];
      const created = await postgrest<ApplicationView[]>('/applications', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Prefer: 'return=representation' },
      });
      const app = created?.[0];
      if (!app) throw new Error('Create application returned no rows');
      await linkApplication(processId, app.id);
      return app;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['process', processId, 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'all'] });
    },
  });

  // Local UI state
  const [pickerValue, setPickerValue] = useState<string>('');
  const [q, setQ] = useState(''); // optional search filter
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOwnerId, setNewOwnerId] = useState<string>('');

  // owners for the "new application" form (reusing your ownership source)
  const ownersQuery = useQuery({ queryKey: ['ownership'], queryFn: listOwnerships });

  // compute available-for-link apps = all - linked-to-this-process
  const linkedIds = new Set((linkedQ.data || []).map(x => x.application_id));
  const availableApps = (allAppsQ.data || [])
    .filter(a => !linkedIds.has(a.id))
    .filter(a => (q ? a.name.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div className="mt-3 rounded-xl border bg-white p-3">
      <h4 className="font-medium mb-2">Applications</h4>

      {/* Linked list */}
      {linkedQ.isLoading ? <p>Loading linked…</p> : null}
      {linkedQ.error ? <p className="text-sm text-red-600">{(linkedQ.error as Error).message}</p> : null}

      <ul className="grid gap-2">
        {(linkedQ.data || []).map(link => (
          <li key={link.application_id} className="flex items-center justify-between border rounded-lg px-3 py-2">
            <div>
              <div className="font-medium">{link.application.name}</div>
              <div className="text-xs text-neutral-600">
                {link.application.owner?.name ? `Owner: ${link.application.owner.name}` : 'No owner'}
              </div>
            </div>
            <button
              className="rounded-lg px-3 py-1 border text-red-600 disabled:opacity-60"
              disabled={unlinkMut.isPending}
              onClick={() => unlinkMut.mutate({ applicationId: link.application_id })}
            >
              Remove
            </button>
          </li>
        ))}
        {(linkedQ.data || []).length === 0 && <li className="text-sm text-neutral-500">No linked applications.</li>}
      </ul>

      {/* Add existing */}
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        <input
          className="border rounded-lg px-3 py-2 md:col-span-2"
          placeholder="Search applications…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 md:col-span-2"
          value={pickerValue}
          onChange={e => setPickerValue(e.target.value)}
          disabled={allAppsQ.isLoading}
        >
          <option value="">Add existing…</option>
          {availableApps.map(app => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
          disabled={!pickerValue || linkMut.isPending}
          onClick={() => linkMut.mutate({ applicationId: pickerValue })}
        >
          Link application
        </button>
      </div>

      {/* Create new + auto-link */}
      <div className="mt-4">
        <details className="group">
          <summary className="cursor-pointer text-sm text-neutral-700">+ New application</summary>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2 md:col-span-2"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={newOwnerId}
              onChange={e => setNewOwnerId(e.target.value)}
            >
              <option value="">Ownership (optional)</option>
              {(ownersQuery.data || []).map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-4">
              <button
                className="rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
                disabled={!newName.trim() || createApp.isPending}
                onClick={() =>
                  createApp.mutate({
                    name: newName.trim(),
                    description: newDesc.trim() || null,
                    ownerId: newOwnerId || null,
                  })
                }
              >
                {createApp.isPending ? 'Creating…' : 'Create & link'}
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
