
'use client'

import { getApiUrl } from '@/lib/browser/config'
import { auth } from '@/lib/auth'
import { fetchWithTimeout } from '@/lib/fetch-timeout'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('lib/browser/api-isms is browser-only. Use lib/backend/postgrest-isms on the server.')
  }
}

/**
 * Browser PostgREST helper bound to the `isms` schema.
 * - Calls the App Router proxy at /api
 * - Adds Accept-Profile/Content-Profile
 * - Attaches JWT from GoTrue session
 * - 15s timeout, no-store
 * - Parses and returns JSON as T
 */
export async function postgrest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  ensureBrowser()

  const base = getApiUrl() // '/api'
  const method = ((init.method || 'GET').toUpperCase() as Method)

  const headers = new Headers(init.headers || {})
  headers.set('Accept-Profile', 'isms')
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', 'isms')
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
    // surface PostgREST error payloads
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `PostgREST error ${res.status}`)
  }

  // some endpoints (e.g. DELETE) may return empty body
  const text = await res.text()
  return (text ? JSON.parse(text) : (undefined as unknown)) as T
}
