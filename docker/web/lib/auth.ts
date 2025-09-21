import { GoTrueClient } from '@supabase/gotrue-js'
import { fetchWithTimeout } from './fetch-timeout'

export const auth = new GoTrueClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL!,   // e.g. http://dockerhost1:7779
  autoRefreshToken: true,
  persistSession: true,
  storageKey: 'isms-auth',
  fetch: async (input: RequestInfo, init?: RequestInit) => {
    // All auth requests capped at 15s
    return fetchWithTimeout(input as any, init)
  },
})
