// app/processes/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { postgrest } from '@/lib/browser/api-isms';
import { listOwnerships, OwnershipView } from '@/lib/browser/isms-ownership';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'



/*
   ###    ########  ####
  ## ##   ##     ##  ##
 ##   ##  ##     ##  ##
##     ## ########   ##
######### ##         ##
##     ## ##         ##
##     ## ##        ####
*/

/*
88""Yb 88""Yb  dP"Yb   dP""b8 888888 .dP"Y8 .dP"Y8
88__dP 88__dP dP   Yb dP   `" 88__   `Ybo." `Ybo."
88"""  88"Yb  Yb   dP Yb      88""   o.`Y8b o.`Y8b
88     88  Yb  YbodP   YboodP 888888 8bodP' 8bodP'
*/
type ProcessView = {
  id: string;
  name: string;
  description: string | null;
  owner: OwnershipView | null;
};

type ProcessRow = {
  id?: string;
  name: string;
  owner_id: string | null;
  description: string | null;
};

async function listProcesses() {
  // GET /processes?select=id,name,description,owner:ownership(id,name)&order=name.asc
  return await postgrest<ProcessView[]>(
    '/processes?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  );
}

async function createProcess(input: ProcessView) {
  const { id, owner, ...rest } = input;
  const dataModel: ProcessRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<ProcessView[]>('/processes', {
    method: 'POST',
    body: JSON.stringify([dataModel]),
    headers: { Prefer: 'return=representation' },
  });
}

async function updateProcess(id: string, input: Partial<ProcessView>) {
  const { owner, ...rest } = input;
  const dataModel: Partial<ProcessRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<ProcessRow[]>(
    `/processes?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  );
}

async function deleteProcess(id: string) {
  return await postgrest<null>(`/processes?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}


/*
88     88 88b 88 88  dP .dP"Y8
88     88 88Yb88 88odP  `Ybo."
88  .o 88 88 Y88 88"Yb  o.`Y8b
88ood8 88 88  Y8 88  Yb 8bodP'
*/
type ApplicationLabel = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string } | null;
};

type ProcessApplicationView = {
  // composite PK (process_id, application_id) — no surrogate id needed for UI
  application: ApplicationLabel;
  application_id: string;
  process_id: string;
};


async function listLinkedApplications(processId: string) {
  // Embed the application label for nice rendering
  return await postgrest<ProcessApplicationView[]>(
    `/process_applications?process_id=eq.${encodeURIComponent(
      processId
    )}&select=process_id,application_id,application:applications(id,name,description,owner:ownership(id,name))&order=application(name)asc`,
    { method: 'GET' }
  );
}

async function listAllApplications() {
  // We’ll filter client-side to exclude ones already linked
  return await postgrest<ApplicationLabel[]>(
    `/applications?select=id,name,description,owner:ownership(id,name)&order=name.asc`,
    { method: 'GET' }
  );
}

async function linkApplication(processId: string, applicationId: string) {
  return await postgrest<{ process_id: string; application_id: string }[]>(
    '/process_applications',
    {
      method: 'POST',
      body: JSON.stringify([{ process_id: processId, application_id: applicationId }]),
      headers: { Prefer: 'return=representation' },
    }
  );
}

async function unlinkApplication(processId: string, applicationId: string) {
  // composite-key delete
  return await postgrest<null>(
    `/process_applications?process_id=eq.${encodeURIComponent(
      processId
    )}&application_id=eq.${encodeURIComponent(applicationId)}`,
    { method: 'DELETE' }
  );
}



/*
########     ###     ######   ########
##     ##   ## ##   ##    ##  ##
##     ##  ##   ##  ##        ##
########  ##     ## ##   #### ######
##        ######### ##    ##  ##
##        ##     ## ##    ##  ##
##        ##     ##  ######   ########
*/
export default function ProcessesPage() {
  const queryClient = useQueryClient();

  const processesQuery = useQuery({ queryKey: ['processes'], queryFn: listProcesses });
  const ownersQuery = useQuery({ queryKey: ['ownership'], queryFn: listOwnerships });

  const create = useMutation({
    mutationFn: createProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['processes'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProcessView> }) =>
      updateProcess(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['processes'] });
      const previous = queryClient.getQueryData<ProcessView[]>(['processes']);
      if (previous) {
        queryClient.setQueryData<ProcessView[]>(
          ['processes'],
          previous.map(p => (p.id === id ? { ...p, ...patch } : p))
        );
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['processes'], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['processes'] }),
  });

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['processes'] }),
  });

  // Create form state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');

  // Inline edit state
  // Map of all Views (by id) that are being edited
  const [editing, setEditing] = useState<Record<string, ProcessView>>({});
  // Map of all records (by id) that are expanded to show links
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const processes = useMemo(() => processesQuery.data ?? [], [processesQuery.data]);
  const owners = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Processes</h1>
      </div>

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
                  /*
                  888888 8888b.  88 888888  dP"Yb  88""Yb
                  88__    8I  Yb 88   88   dP   Yb 88__dP
                  88""    8I  dY 88   88   Yb   dP 88"Yb
                  888888 8888Y"  88   88    YbodP  88  Yb
                  */
                  <div className="grid gap-2 md:grid-cols-[1fr,2fr,1fr,auto]">
                    <input
                      className="border rounded-lg px-3 py-2"
                      value={value.name}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: { ...prev[listItem.id], name: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="border rounded-lg px-3 py-2"
                      placeholder="Description (optional)"
                      value={value.description ?? ''}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: { ...prev[listItem.id], description: e.target.value },
                        }))
                      }
                    />
                    <select
                      className="border rounded-lg px-3 py-2"
                      value={value.owner?.id ?? ''}
                      onChange={e =>
                        setEditing(prev => ({
                          ...prev,
                          [listItem.id]: {
                            ...prev[listItem.id],
                            owner: owners.find(o => o.id === e.target.value) ?? null,
                          },
                        }))
                      }
                    >
                      <option value="">Owner (optional)</option>
                      {owners.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
                        disabled={update.isPending || value.name.trim().length === 0}
                        onClick={() => {
                          const patch: Partial<ProcessView> = {
                            name: value.name.trim(),
                            description: value.description?.trim() || null,
                            owner: value.owner || null,
                          }
                          update.mutate({ id: listItem.id, patch })
                          setEditing(prev => {
                            const { [listItem.id]: _omit, ...rest } = prev
                            return rest
                          })
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-xl px-3 py-2 border bg-white text-red-600 disabled:opacity-60"
                        disabled={remove.isPending}
                        onClick={() => {
                          const ok = confirm(
                            'Delete this process?\n\nNote: if this record is referenced by junctions, deletion may be blocked by FKs.'
                          )
                          if (ok) remove.mutate(listItem.id)
                        }}
                      >
                        Delete
                      </button>
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing(prev => {
                            const { [listItem.id]: _omit, ...rest } = prev
                            return rest
                          })
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /*
                  8888b.  88 .dP"Y8 88""Yb 88        db    Yb  dP
                   8I  Yb 88 `Ybo." 88__dP 88       dPYb    YbdP
                   8I  dY 88 o.`Y8b 88"""  88  .o  dP__Yb    8P
                  8888Y"  88 8bodP' 88     88ood8 dP""""Yb  dP
                  */
                  // md:grid-cols-6 -> 6 column grid
                  <div className="grid gap-1 grid-cols-1 md:grid-cols-[auto,1fr,2fr,1fr,auto] md:items-center">
                    {/* ▼ / ▲ toggle on the left */}
                    <button
                      className="text-lg text-neutral-500 hover:text-black"
                      onClick={() =>
                        setExpanded(prev => ({ ...prev, [listItem.id]: !prev[listItem.id] }))
                      }
                    >
                      <FontAwesomeIcon
                        icon={expanded[listItem.id] ? faChevronDown : faChevronRight}
                        className="w-4 h-4"
                      />
                    </button>

                    <button
                      className="font-medium text-left"
                      onClick={() =>
                        setExpanded(prev => ({ ...prev, [listItem.id]: !prev[listItem.id] }))
                      }
                    >
                      {listItem.name}
                    </button>

                    <div className="text-sm text-neutral-700">
                      {listItem.description ? (
                        <span className="text-neutral-600">{listItem.description}</span>
                      ) : (
                        <span className="text-neutral-400">No description</span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-700">
                      Owner: <span className="text-neutral-600">{listItem.owner?.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl px-3 py-2 border bg-white"
                        onClick={() =>
                          setEditing(prev => ({
                            ...prev,
                            [listItem.id]: listItem,
                          }))
                        }
                      >
                        Edit
                      </button>
                    </div>

                    {/*
                       db    88""Yb 88""Yb 88     88  dP""b8    db    888888 88  dP"Yb  88b 88 .dP"Y8     88""Yb    db    88""Yb 888888 88    db    88
                      dPYb   88__dP 88__dP 88     88 dP   `"   dPYb     88   88 dP   Yb 88Yb88 `Ybo."     88__dP   dPYb   88__dP   88   88   dPYb   88
                     dP__Yb  88"""  88"""  88  .o 88 Yb       dP__Yb    88   88 Yb   dP 88 Y88 o.`Y8b     88"""   dP__Yb  88"Yb    88   88  dP__Yb  88  .o
                    dP""""Yb 88     88     88ood8 88  YboodP dP""""Yb   88   88  YbodP  88  Y8 8bodP'     88     dP""""Yb 88  Yb   88   88 dP""""Yb 88ood8
                    */}
                    {expanded[listItem.id] && (
                      <div className="col-span-full">
                        <LinkedApplicationsSection processId={listItem.id} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {
        /*
        88b 88 888888 Yb        dP     888888  dP"Yb  88""Yb 8b    d8
        88Yb88 88__    Yb  db  dP      88__   dP   Yb 88__dP 88b  d88
        88 Y88 88""     YbdPYbdP       88""   Yb   dP 88"Yb  88YbdP88
        88  Y8 888888    YP  YP        88      YbodP  88  Yb 88 YY 88
        */
      }
      <div className="bg-white border rounded-2xl p-4">
        <h2 className="text-lg font-medium mb-2">Create process</h2>
        <form
          className="grid gap-2 md:grid-cols-4"
          onSubmit={e => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            create.mutate(
              {
                id: '',
                name: trimmed,
                description: desc.trim() || null,
                owner: owners.find(o => o.id === ownerId) || null,
              },
              {
                onSuccess: () => {
                  setName('');
                  setDesc('');
                  setOwnerId('');
                },
              }
            );
          }}
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Description (optional)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
          >
            <option value="">Owner (optional)</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {(create.isError || update.isError || remove.isError) && (
            <div className="md:col-span-4">
              <p className="text-sm text-red-600">
                {((create.error || update.error || remove.error) as Error)?.message}
              </p>
              <p className="text-xs text-neutral-500">
                Writes require <code>editor</code>; reads are allowed for <code>authenticated</code>.
              </p>
            </div>
          )}

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
            >
              {create.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



/*
##       #### ##    ## ##    ##     ######  ########  ######  ######## ####  #######  ##    ##
##        ##  ###   ## ##   ##     ##    ## ##       ##    ##    ##     ##  ##     ## ###   ##
##        ##  ####  ## ##  ##      ##       ##       ##          ##     ##  ##     ## ####  ##
##        ##  ## ## ## #####        ######  ######   ##          ##     ##  ##     ## ## ## ##
##        ##  ##  #### ##  ##            ## ##       ##          ##     ##  ##     ## ##  ####
##        ##  ##   ### ##   ##     ##    ## ##       ##    ##    ##     ##  ##     ## ##   ###
######## #### ##    ## ##    ##     ######  ########  ######     ##    ####  #######  ##    ##
*/
function LinkedApplicationsSection({ processId }: { processId: string }) {
  const queryClient = useQueryClient();

  // linked for this process
  const linkedQ = useQuery({
    queryKey: ['process', processId, 'applications'],
    queryFn: () => listLinkedApplications(processId),
  });

  // all apps (we'll exclude ones already linked to this process)
  const allAppsQ = useQuery({
    queryKey: ['applications', 'all'],
    queryFn: listAllApplications,
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
      const created = await postgrest<ApplicationLabel[]>('/applications', {
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
