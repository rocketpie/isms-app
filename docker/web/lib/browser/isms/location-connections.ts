//lib/browser/isms/location-connections.ts
'use client'

import { postgrest } from '..//api-isms'
import { ConnectionView } from './assetTypes'

export async function listLinkedConnections(locationId: string) {
  const response = await postgrest<{ connection: ConnectionView }[]>(
    `/location_connections?location_id=eq.${encodeURIComponent(locationId)}` +
    `&select=connection:connections(id,name,description,owner:ownership(id,name))` +
    `&order=connection(name).asc`,
    { method: 'GET' }
  )
  return response.map(row => row.connection)
}

export async function linkConnection(locationId: string, connectionId: string) {
  await postgrest('/location_connections', {
    method: 'POST',
    body: JSON.stringify([{ location_id: locationId, connection_id: connectionId }]),
  })
}

export async function unlinkConnection(locationId: string, connectionId: string) {
  return await postgrest<null>(
    `/location_connections?location_id=eq.${encodeURIComponent(locationId)}` +
    `&connection_id=eq.${encodeURIComponent(connectionId)}`,
    { method: 'DELETE' }
  )
}
