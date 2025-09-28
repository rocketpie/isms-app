//lib/auth.ts
 
import { GoTrueClient } from '@supabase/gotrue-js'
import { fetchWithTimeout } from './fetch-timeout'
import { getAuthUrl } from './browser/config'

export const auth = new GoTrueClient({
  url: getAuthUrl(),   // e.g. http://dockerhost1:7779
  autoRefreshToken: true,
  persistSession: true,
  storageKey: 'isms-auth',
  fetch: fetchWithTimeout, // All auth requests capped at 15s
})
