import { auth } from './auth'
import { fetchWithTimeout } from './fetch-timeout'
import { getApiUrl } from './config'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Schema = 'isms' | 'app';
const apiUrl = getApiUrl()

export async function postgrest<T = unknown>(path: string, init: RequestInit = {}, schema: Schema): Promise<T> {
  const base = getApiUrl();
  const method = ((init.method || 'GET').toUpperCase() as Method)

  const headers = new Headers(init.headers || {});
  headers.set('Accept-Profile', schema);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', schema);
  }

  // Attach user JWT
  const { data } = await auth.getSession()
  const token = data?.session?.access_token
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`) // KB pattern: attach JWT from auth.getSession()
  }

  const response = await fetchWithTimeout(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache: 'no-store', // KB: no-store for PostgREST calls
    redirect: 'manual',
  });

  if (!response.ok) throw new Error(`PostgREST ${response.status}: ${await response.text()}`)
  return (await response.json()) as T
}
