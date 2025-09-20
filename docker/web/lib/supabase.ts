// web/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const GOTRUE_URL = process.env.NEXT_PUBLIC_GOTRUE_URL!
export const supabase = createClient(
  // "supabaseUrl" can be any string; we only use auth via GoTrue.
  GOTRUE_URL,
  // anon key not needed for local GoTrue; pass empty. We’ll use gotrue.url override.
  '',
  {
    auth: {
      persistSession: true,
      storageKey: 'isms-auth',
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-client-info': 'isms-app' },
    },
  }
)
