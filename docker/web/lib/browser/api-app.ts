
'use client'

import { getApiUrl } from '@/lib/browser/config'
import { auth } from '@/lib/auth'
import { fetchWithTimeout } from '@/lib/fetch-timeout'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('lib/browser/api-app is browser-only. Use lib/backend/postgrest-app on the server.')
  }
}

/**
 * Browser PostgREST helper bound to the `app` schema.
 * Ideal for RPCs like /rpc/whoami, admin_grant_app_role, etc.
 */
export async function postgrest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  ensureBrowser()

  const base = getApiUrl() // '/api'
  const method = ((init.method || 'GET').toUpperCase() as Method)

  const headers = new Headers(init.headers || {})
  headers.set('Accept-Profile', 'app')
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', 'app')
    if (!headers.has('Prefer')) headers.set('Prefer', 'return=representation')
  }

  // Attach user JWT (from browser session)
  const { data } = await auth.getSession()
  const token = data?.session?.access_token
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetchWithTimeout(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `PostgREST error ${res.status}`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : (undefined as unknown)) as T
}
