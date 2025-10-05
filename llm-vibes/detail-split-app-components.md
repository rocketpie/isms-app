I have this
// app/processes/page.tsx
[...]

it's become a little unwieldly. what parts can we split into other files 
 



########################################################################
########################################################################





Here’s how I’d slice this up so the page becomes small/compose-y while keeping the PostgREST shape/writes exactly as we designed (embed for reads, FK for writes).

# Affected components & KB refs

* **Frontend**: `app/processes/page.tsx`, new `app/processes/_components/*`, `app/_hooks/*`, `lib/browser/*` (per Next.js app layout and data helpers) 
* **API usage & conventions**: PostgREST helpers, profile headers, and embedding rules  
* **Architecture / data flow**: React Query → `/api` proxy → PostgREST (RLS) 

---

## 1) Move all types to a shared file

Create a single source of truth for the page’s types.

```bash
mkdir -p lib/types
```

**`lib/types/isms.ts`**

```ts
export type OwnershipLabel = { id: string; name: string };

export type ProcessView = {
  id: string;
  name: string;
  description: string | null;
  owner: OwnershipLabel | null;
};

export type ProcessRow = {
  id?: string;
  name: string;
  owner_id: string | null;
  description: string | null;
};

export type ApplicationLabel = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string } | null;
};

export type ProcessApplicationView = {
  application: ApplicationLabel;
  application_id: string;
  process_id: string;
};
```

Rationale: keeps UI/DB shapes clear and aligned with our “embed on reads, pass FK on writes” convention. 

---

## 2) Split API calls into focused client modules

Keep **PostgREST** plumbing in `lib/browser/api-isms` (as-is) and add thin, domain-focused files.

```bash
mkdir -p lib/browser/isms
```

**`lib/browser/isms/processes.ts`**

```ts
import { postgrest } from '@/lib/browser/api-isms';
import type { ProcessView, ProcessRow } from '@/lib/types/isms';

export async function listProcesses() {
  return await postgrest<ProcessView[]>(
    '/processes?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  );
}

export async function createProcess(input: ProcessView) {
  const { id, owner, ...rest } = input;
  const body: ProcessRow = { ...rest, owner_id: owner?.id ?? null };
  return await postgrest<ProcessView[]>('/processes', {
    method: 'POST',
    body: JSON.stringify([body]),
    headers: { Prefer: 'return=representation' },
  });
}

export async function updateProcess(id: string, input: Partial<ProcessView>) {
  const { owner, ...rest } = input;
  const patch: Partial<ProcessRow> = { ...rest, owner_id: owner?.id ?? null };
  return await postgrest<ProcessRow[]>(
    `/processes?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch), headers: { Prefer: 'return=representation' } }
  );
}

export async function deleteProcess(id: string) {
  return await postgrest<null>(`/processes?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}
```

**`lib/browser/isms/process-applications.ts`**

```ts
import { postgrest } from '@/lib/browser/api-isms';
import type { ApplicationLabel, ProcessApplicationView } from '@/lib/types/isms';

export async function listLinkedApplications(processId: string) {
  return await postgrest<ProcessApplicationView[]>(
    `/process_applications?process_id=eq.${encodeURIComponent(processId)}&select=process_id,application_id,application:applications(id,name,description,owner:ownership(id,name))&order=application(name)asc`,
    { method: 'GET' }
  );
}

export async function listAllApplications() {
  return await postgrest<ApplicationLabel[]>(
    `/applications?select=id,name,description,owner:ownership(id,name)&order=name.asc`,
    { method: 'GET' }
  );
}

export async function linkApplication(processId: string, applicationId: string) {
  return await postgrest<{ process_id: string; application_id: string }[]>(
    '/process_applications',
    {
      method: 'POST',
      body: JSON.stringify([{ process_id: processId, application_id: applicationId }]),
      headers: { Prefer: 'return=representation' },
    }
  );
}

export async function unlinkApplication(processId: string, applicationId: string) {
  return await postgrest<null>(
    `/process_applications?process_id=eq.${encodeURIComponent(processId)}&application_id=eq.${encodeURIComponent(applicationId)}`,
    { method: 'DELETE' }
  );
}

export async function createApplication(input: { name: string; description: string | null; ownerId: string | null }) {
  const body = [{ name: input.name, description: input.description, owner_id: input.ownerId }];
  return await postgrest<ApplicationLabel[]>('/applications', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Prefer: 'return=representation' },
  });
}
```

Why modules? Matches our KB pattern of browser helpers and keeps PostgREST rules close to the call sites.  

---

## 3) Extract React Query hooks (co-locate logic, keep pages dumb)

```bash
mkdir -p app/_hooks
```

**`app/_hooks/queryKeys.ts`**

```ts
export const qk = {
  processes: ['processes'] as const,
  ownership: ['ownership'] as const,
  processApplications: (processId: string) => ['process', processId, 'applications'] as const,
  allApplications: ['applications', 'all'] as const,
};
```

**`app/_hooks/useProcesses.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProcesses, createProcess, updateProcess, deleteProcess } from '@/lib/browser/isms/processes';
import type { ProcessView } from '@/lib/types/isms';
import { qk } from './queryKeys';

export function useProcesses() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: qk.processes, queryFn: listProcesses });

  const create = useMutation({
    mutationFn: createProcess,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.processes }),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProcessView> }) => updateProcess(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.processes });
      const previous = qc.getQueryData<ProcessView[]>(qk.processes);
      if (previous) {
        qc.setQueryData<ProcessView[]>(
          qk.processes,
          previous.map(p => (p.id === id ? { ...p, ...patch } : p))
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) qc.setQueryData(qk.processes, ctx.previous); },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.processes }),
  });

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.processes }),
  });

  return { list, create, update, remove };
}
```

**`app/_hooks/useProcessApplications.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listLinkedApplications, listAllApplications, linkApplication, unlinkApplication, createApplication } from '@/lib/browser/isms/process-applications';
import { qk } from './queryKeys';
import type { ProcessApplicationView } from '@/lib/types/isms';

export function useProcessApplications(processId: string) {
  const qc = useQueryClient();

  const linked = useQuery({
    queryKey: qk.processApplications(processId),
    queryFn: () => listLinkedApplications(processId),
  });

  const allApps = useQuery({
    queryKey: qk.allApplications,
    queryFn: listAllApplications,
    staleTime: 30_000,
  });

  const link = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => linkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await qc.cancelQueries({ queryKey: qk.processApplications(processId) });
      const prev = qc.getQueryData<ProcessApplicationView[]>(qk.processApplications(processId)) || [];
      const app = (allApps.data || []).find(a => a.id === applicationId);
      if (app) {
        qc.setQueryData<ProcessApplicationView[]>(
          qk.processApplications(processId),
          [...prev, { process_id: processId, application_id: app.id, application: app }]
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qk.processApplications(processId), ctx.prev); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.processApplications(processId) });
      qc.invalidateQueries({ queryKey: qk.allApplications });
    },
  });

  const unlink = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => unlinkApplication(processId, applicationId),
    onMutate: async ({ applicationId }) => {
      await qc.cancelQueries({ queryKey: qk.processApplications(processId) });
      const prev = qc.getQueryData<ProcessApplicationView[]>(qk.processApplications(processId)) || [];
      qc.setQueryData<ProcessApplicationView[]>(
        qk.processApplications(processId),
        prev.filter(x => x.application_id !== applicationId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qk.processApplications(processId), ctx.prev); },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.processApplications(processId) });
      qc.invalidateQueries({ queryKey: qk.allApplications });
    },
  });

  const createAndLink = useMutation({
    mutationFn: createApplication,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.processApplications(processId) });
      qc.invalidateQueries({ queryKey: qk.allApplications });
    },
  });

  return { linked, allApps, link, unlink, createAndLink };
}
```

Hooks keep React Query concerns isolated while the page stays declarative. This mirrors the data-flow we document. 

---

## 4) Extract reusable UI components

```bash
mkdir -p app/processes/_components
```

**`app/processes/_components/OwnerSelect.tsx`**

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { listOwnerships } from '@/lib/browser/isms-ownership';

export function OwnerSelect(props: {
  value: string | '';
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ownersQ = useQuery({ queryKey: ['ownership'], queryFn: listOwnerships });
  return (
    <select className={props.className} value={props.value} onChange={e => props.onChange(e.target.value)}>
      <option value="">{props.placeholder ?? 'Owner (optional)'}</option>
      {(ownersQ.data || []).map(o => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}
```

**`app/processes/_components/ProcessEditorRow.tsx`**

* Receives `{value, owners, onSave, onDelete, onCancel, disabled}`.
* Contains the inputs and buttons for the inline editor.

**`app/processes/_components/ProcessDisplayRow.tsx`**

* Receives `{item, expanded, onToggle, onEdit}`.
* Renders the collapsed row and the chevron.

**`app/processes/_components/ProcessCreateForm.tsx`**

* Holds the “Create process” form (state local to this component).
* Uses `OwnerSelect`.

**`app/processes/_components/LinkedApplicationsSection.tsx`**

* Move your whole section here, but swap its internal data calls to the **hooks** from step 3.
* Props: `{ processId: string }`.

This organization keeps presentational concerns in small, testable components while all fetching/mutations live in hooks. It also aligns with our “thin Next.js app, PostgREST-heavy shaping” approach.  

---

## 5) The page becomes simple composition

**`app/processes/page.tsx`**

```tsx
'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProcesses } from '@/app/_hooks/useProcesses';
import { qk } from '@/app/_hooks/queryKeys';
import { listOwnerships } from '@/lib/browser/isms-ownership';
import type { ProcessView } from '@/lib/types/isms';
import { OwnerSelect } from './_components/OwnerSelect';
import ProcessEditorRow from './_components/ProcessEditorRow';
import ProcessDisplayRow from './_components/ProcessDisplayRow';
import LinkedApplicationsSection from './_components/LinkedApplicationsSection';

export default function ProcessesPage() {
  const { list: processesQ, create, update, remove } = useProcesses();
  const ownersQ = useQuery({ queryKey: qk.ownership, queryFn: listOwnerships });

  const processes = useMemo(() => processesQ.data ?? [], [processesQ.data]);
  const owners = useMemo(() => ownersQ.data ?? [], [ownersQ.data]);

  // minimal local UI state
  const [editing, setEditing] = useState<Record<string, ProcessView>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // render…
}
```

Now `page.tsx` is ~100–150 lines of orchestration rather than everything.

---

## 6) Tiny polish & correctness notes

* Your delete confirmation text mentions FK blocks; in our ISMS schema, junction FKs use **`ON DELETE CASCADE`**, so links shouldn’t block deletes (good to keep the warning, but you can reword it). 
* Keep **embedding only for reads** (as you already do) and pass `owner_id` on writes — that’s our ADR and keeps RLS decisions server-side.  
* Keep the `/api` proxy + headers behavior in the helpers, not components; that’s per KB guidance.  

---

## 7) Suggested folder layout (delta)

```
lib/
  browser/
    api-isms.ts           # existing: postgrest()
    isms/
      processes.ts        # NEW
      process-applications.ts
  types/
    isms.ts               # NEW

app/
  _hooks/
    queryKeys.ts          # NEW
    useProcesses.ts
    useProcessApplications.ts

  processes/
    page.tsx
    _components/
      OwnerSelect.tsx
      ProcessCreateForm.tsx
      ProcessEditorRow.tsx
      ProcessDisplayRow.tsx
      LinkedApplicationsSection.tsx
```

---

If you want, I can generate any of the component skeletons above in full.
