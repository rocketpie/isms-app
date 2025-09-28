// lib/browser/isms/application-systems.ts
'use client'

import { postgrest } from '../api-isms'
import { SystemView } from './assetTypes'

export type ApplicationSystemView = {
  application_id: string
  system_id: string
  system: SystemView
}

export type ApplicationSystemRow = {
  application_id: string
  system_id: string
}

export async function listLinkedSystems(applicationId: string) {
  return await postgrest<ApplicationSystemView[]>(
    `/application_systems?application_id=eq.${encodeURIComponent(applicationId)}` +
      `&select=application_id,system_id,system:systems(id,name,description,owner:ownership(id,name))` +
      `&order=system(name).asc`,
    { method: 'GET' }
  )
}

export async function linkSystem(applicationId: string, systemId: string) {
  return await postgrest<ApplicationSystemView[]>(
    '/application_systems',
    {
      method: 'POST',
      body: JSON.stringify([{ application_id: applicationId, system_id: systemId }]),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function unlinkSystem(applicationId: string, systemId: string) {
  return await postgrest<null>(
    `/application_systems?application_id=eq.${encodeURIComponent(applicationId)}&system_id=eq.${encodeURIComponent(systemId)}`,
    { method: 'DELETE' }
  )
}
