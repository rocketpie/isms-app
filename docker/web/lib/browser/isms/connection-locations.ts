//lib/browser/isms/location-connections.ts
'use client'

import { postgrest } from '..//api-isms'
import { LocationView } from './assetTypes'

export async function listLinkedLocations(connectionId: string) {
  const response = await postgrest<{ location: LocationView }[]>(
    `/location_connections?connection_id=eq.${encodeURIComponent(connectionId)}` +
    `&select=location:locations(id,name,description,owner:ownership(id,name))` +
    `&order=location(name).asc`,
    { method: 'GET' }
  )
  return response.map(row => row.location)
}

export async function linkLocation(connectionId: string, locationId: string) {
  await postgrest('/location_connections', {
    method: 'POST',
    body: JSON.stringify([{ connection_id: connectionId, location_id: locationId }]),
  })
}

export async function unlinkLocation(connectionId: string, locationId: string) {
  return await postgrest<null>(
    `/location_connections?connection_id=eq.${encodeURIComponent(connectionId)}` +
    `&location_id=eq.${encodeURIComponent(locationId)}`,
    { method: 'DELETE' }
  )
}
