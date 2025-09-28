//lib/browser/isms/applications.ts
'use client'

import { postgrest } from "../api-isms"
import { ApplicationRow, ApplicationView } from "./assetTypes"

export async function listApplications() {
  return await postgrest<ApplicationView[]>(
    '/applications?select=id,name,description,owner:ownership(id,name)&order=name.asc',
    { method: 'GET' }
  )
}

export async function createApplication(input: ApplicationView) {
  // strip the owner object
  const { id, owner, ...rest } = input
  // set the owner_id, if any
  const dataModel: ApplicationRow = {
    ...rest,
    owner_id: owner?.id ?? null
  }
  return await postgrest<ApplicationView>('/applications', {
    method: 'POST',
    body: JSON.stringify([dataModel]),
    headers: { Prefer: 'return=representation' },
  })
}

export async function updateApplication(id: string, input: Partial<ApplicationView>) {
  // strip the owner object
  const { owner, ...rest } = input
  // set the owner_id, if any
  const dataModel: Partial<ApplicationRow> = {
    ...rest,
    owner_id: owner?.id ?? null
  }
  return await postgrest<ApplicationRow[]>(
    `/applications?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataModel),
      headers: { Prefer: 'return=representation' },
    }
  )
}

export async function deleteApplication(id: string) {
  return await postgrest<null>(`/applications?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
