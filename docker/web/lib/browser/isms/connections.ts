// lib/browser/isms/connections.ts
'use client'

import { postgrest } from '../api-isms'
import { ConnectionRow, ConnectionView } from './assetTypes'

export async function listConnections() {
  return await postgrest<ConnectionView[]>(
    '/connections?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  )
}

export async function createConnection(input: ConnectionView) {
  const { id, owner, ...rest } = input
  const dataModel: ConnectionRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<ConnectionView[]>(
    '/connections?select=id,name,description,owner:ownership(id,name)',
    {
      method: 'POST',
      body: JSON.stringify([dataModel]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function updateConnection(
  id: string,
  input: Partial<ConnectionView>
) {
  const { owner, ...rest } = input
  const dataModel: Partial<ConnectionRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<ConnectionView[]>(
    `/connections?id=eq.${encodeURIComponent(id)}&select=id,name,description,owner:ownership(id,name)`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function deleteConnection(id: string) {
  return await postgrest<null>(`/connections?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}


