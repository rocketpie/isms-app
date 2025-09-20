import { GoTrueClient } from '@supabase/gotrue-js'

export const auth = new GoTrueClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL!, // e.g. http://dockerhost1:7779
  autoRefreshToken: true,
  persistSession: true,
  storageKey: 'isms-auth',
})
