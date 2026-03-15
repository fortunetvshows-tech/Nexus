import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    '[Nexus] Missing NEXT_PUBLIC_SUPABASE_URL — ' +
    'check your .env.local file'
  )
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[Nexus] Missing SUPABASE_SERVICE_ROLE_KEY — ' +
    'check your .env.local file'
  )
}

/**
 * Server-side only Supabase client.
 * Uses service role key — bypasses RLS.
 * NEVER import this in client components or pages.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 * All financial table writes must go through this client
 * via service functions in /lib/services/ only.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
