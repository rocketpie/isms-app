// lib/backend/postgrest.ts
import 'server-only'

import { fetchWithTimeout } from '../fetch-timeout'
import { getPostgrestUrl } from './config';
import { logDebug } from '../logDebug';

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Schema = 'isms' | 'app';

/**
 * Optional server auth.
 * If you have a user JWT (e.g., forwarded from a route handler), pass it here.
 * Otherwise requests go unauthenticated (useful for public/OpenAPI endpoints).
 */
type PostgrestServerOptions = {
  /** Bearer token (user JWT) to forward to PostgREST. */
  token?: string
}

/** Safe URL join (avoids double slashes) */
function join(base: string, path: string): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${base}${path}`
}

/**
 * Server-side PostgREST calling
 * - Adds Accept-Profile / Content-Profile = $Schema
 * - Forwards Authorization if provided (opts.token or init.headers)
 * - 15s timeout (see ADR-002), no-store cache
 * - Parses JSON response (if any) and returns typed T
 */
export async function postgrest<T = unknown>(
  path: string,
  init: RequestInit = {},
  schema: Schema = 'isms',
  options: PostgrestServerOptions = {},
): Promise<T> {
  const base = getPostgrestUrl()
  const url = join(base, path)

  const method = ((init.method || 'GET').toUpperCase() as Method)
  const headers = new Headers(init.headers || {});

  headers.set('Accept-Profile', schema);
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Profile', schema); // write path needs Content-Profile
    if (!headers.has('Prefer')) headers.set('Prefer', 'return=representation')
  }

  // Authorization (server: only if explicitly provided)
  if (options.token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetchWithTimeout(url, {
    ...init,
    method,
    headers,
    cache: 'no-store', // KB: no-store for PostgREST calls
    redirect: 'manual',
  });

  logDebug(`[postgrest.ts] ${method} ${url}: ${response.status}`)

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(errText || `PostgREST error ${response.status}`)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : (undefined as unknown)) as T
}
