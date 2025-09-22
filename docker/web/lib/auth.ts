import { GoTrueClient } from '@supabase/gotrue-js'
import { fetchWithTimeout } from './fetch-timeout'
import { getAuthUrl } from './browser/config'

export const auth = new GoTrueClient({
  url: getAuthUrl(),   // e.g. http://dockerhost1:7779
  autoRefreshToken: true,
  persistSession: true,
  storageKey: 'isms-auth',
  fetch: async (input: RequestInfo, init?: RequestInit) => {
    // All auth requests capped at 15s
    return fetchWithTimeout(input as any, init)
  },
})
