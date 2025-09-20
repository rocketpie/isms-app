// web/lib/api.ts
import { supabase } from './supabase'

const POSTGREST_URL = process.env.NEXT_PUBLIC_POSTGREST_URL!

export async function pgrst<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  headers.set('Accept-Profile', 'isms') // isms is the default exposed schema
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${POSTGREST_URL}${path}`, { ...init, headers, cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostgREST ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}
