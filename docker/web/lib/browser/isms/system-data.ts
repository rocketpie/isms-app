// lib/browser/isms/systemData.ts
'use client'

import { postgrest } from '../api-isms'
import { DataAssetView } from './assetTypes'

export type SystemDataView = {
  system_id: string
  data_id: string
  data: DataAssetView
}

export type SystemDataRow = {
  system_id: string
  data_id: string
}

export async function listLinkedData(systemId: string) {
  return await postgrest<SystemDataView[]>(
    `/system_data?system_id=eq.${encodeURIComponent(systemId)}` +
      `&select=system_id,data_id,data:data(id,name,description,owner:ownership(id,name))` +
      `&order=data(name).asc`,
    { method: 'GET' }
  )
}

export async function linkData(systemId: string, dataId: string) {
  return await postgrest<SystemDataRow[]>(
    '/system_data',
    {
      method: 'POST',
      body: JSON.stringify([{ system_id: systemId, data_id: dataId }]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function unlinkData(systemId: string, dataId: string) {
  return await postgrest<null>(
    `/system_data?system_id=eq.${encodeURIComponent(systemId)}&data_id=eq.${encodeURIComponent(dataId)}`,
    { method: 'DELETE' }
  )
}
