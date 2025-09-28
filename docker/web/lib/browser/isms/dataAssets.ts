// lib/browser/isms/dataAssets.ts
'use client'

import { postgrest } from '../api-isms'
import { DataAssetRow, DataAssetView } from './assetTypes'

export async function listData() {
  return await postgrest<DataAssetView[]>(
    '/data?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  )
}

export async function createData(input: DataAssetView) {
  const { id, owner, ...rest } = input
  const dataModel: DataAssetRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<DataAssetView[]>(
    '/data?select=id,name,description,owner:ownership(id,name)',
    {
      method: 'POST',
      body: JSON.stringify([dataModel]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function updateData(id: string, input: Partial<DataAssetView>) {
  const { owner, ...rest } = input
  const dataModel: Partial<DataAssetRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<DataAssetView[]>(
    `/data?id=eq.${encodeURIComponent(id)}&select=id,name,description,owner:ownership(id,name)`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function deleteData(id: string) {
  return await postgrest<null>(`/data?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
