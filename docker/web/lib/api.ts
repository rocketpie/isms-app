import { auth } from './auth'
import { fetchWithTimeout } from './fetch-timeout'

const POSTGREST_URL = process.env.NEXT_PUBLIC_POSTGREST_URL! // your existing var

export async function pgrst<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  headers.set('Accept-Profile', 'isms')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetchWithTimeout(`${POSTGREST_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}
