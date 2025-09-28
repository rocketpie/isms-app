// lib/browser/isms/locations.ts
'use client'

import { postgrest } from '../api-isms'
import { LocationRow, LocationView } from './assetTypes'

export async function listLocations() {
  return await postgrest<LocationView[]>(
    '/locations?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  )
}

export async function createLocation(input: LocationView) {
  const { id, owner, ...rest } = input
  const dataModel: LocationRow = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<LocationView[]>(
    '/locations?select=id,name,description,owner:ownership(id,name)',
    {
      method: 'POST',
      body: JSON.stringify([dataModel]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function updateLocation(id: string, input: Partial<LocationView>) {
  const { owner, ...rest } = input
  const dataModel: Partial<LocationRow> = {
    ...rest,
    owner_id: owner?.id ?? null,
  }
  return await postgrest<LocationView[]>(
    `/locations?id=eq.${encodeURIComponent(id)}&select=id,name,description,owner:ownership(id,name)`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function deleteLocation(id: string) {
  return await postgrest<null>(`/locations?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}


