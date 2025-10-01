//lib/browser/isms/processes.ts
'use client'

import { postgrest } from "../api-isms";
import { ProcessView, ProcessRow } from "./assetTypes";

export async function listProcesses() {
  return await postgrest<ProcessView[]>(
    '/processes?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  );
}

export async function createProcess(item: ProcessView) {
  // strip the owner object
  const { id, owner, ...rest } = item;
  // set the owner_id, if any
  const dataModel: ProcessRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  const response = await postgrest<ProcessView[]>('/processes', {
    method: 'POST',
    body: JSON.stringify([dataModel]),
    headers: { Prefer: 'return=representation' },
  });

  // TODO: remove for CQRS
  return response[0].id;
}

export async function updateProcess(item: ProcessView) {
  // strip the owner object
  const { owner, ...rest } = item
  // set the owner_id, if any
  const dataModel: Partial<ProcessRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  };
  return await postgrest<null>(
    `/processes?id=eq.${encodeURIComponent(item.id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  );
}

export async function deleteProcess(id: string) {
  return await postgrest<null>(`/processes?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
