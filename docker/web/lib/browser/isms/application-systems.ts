// lib/browser/isms/application-systems.ts
'use client'

import { postgrest } from '../api-isms'
import { SystemView } from './assetTypes'

export async function listLinkedSystems(applicationId: string) {
  const response = await postgrest<{ system: SystemView }[]>(
    `/application_systems?application_id=eq.${encodeURIComponent(applicationId)}` + 
    `&select=system:systems(id,name,description,owner:ownership(id,name))` +
    `&order=system(name).asc`,
    { method: 'GET' }
  )
  return response.map(row => row.system)
}

export async function linkSystem(applicationId: string, systemId: string) {
  await postgrest('/application_systems', {
    method: 'POST',
    body: JSON.stringify([{ application_id: applicationId, system_id: systemId }]),
  })
}

export async function unlinkSystem(applicationId: string, systemId: string) {
  return await postgrest<null>(
    `/application_systems?application_id=eq.${encodeURIComponent(applicationId)}` +
    `&system_id=eq.${encodeURIComponent(systemId)}`,
    { method: 'DELETE' }
  )
}
