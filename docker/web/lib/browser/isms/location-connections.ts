// lib/browser/isms/locationConnections.ts
'use client'

import { postgrest } from '..//api-isms'
import { ConnectionView } from './assetTypes'

export type LocationConnectionView = {
  location_id: string
  connection_id: string
  connection: ConnectionView
}

export type LocationConnectionRow = {
  location_id: string
  connection_id: string
}

export async function listLinkedConnections(locationId: string) {
  return await postgrest<LocationConnectionView[]>(
    `/location_connections?location_id=eq.${encodeURIComponent(locationId)}` +
      `&select=location_id,connection_id,connection:connections(id,name,description,owner:ownership(id,name))` +
      `&order=connection(name).asc`,
    { method: 'GET' }
  )
}

export async function linkConnection(locationId: string, connectionId: string) {
  return await postgrest<LocationConnectionRow[]>(
    '/location_connections',
    {
      method: 'POST',
      body: JSON.stringify([{ location_id: locationId, connection_id: connectionId }]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function unlinkConnection(locationId: string, connectionId: string) {
  return await postgrest<null>(
    `/location_connections?location_id=eq.${encodeURIComponent(locationId)}&connection_id=eq.${encodeURIComponent(connectionId)}`,
    { method: 'DELETE' }
  )
}
