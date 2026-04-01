import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error(
    '[ProofGrid:Supabase] CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
    'All database operations will fail. ' +
    'Check Vercel environment variables.'
  )
}

if (!supabaseServiceKey) {
  console.error(
    '[ProofGrid:Supabase] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'All database operations will fail. ' +
    'Check Vercel environment variables.'
  )
}

/**
 * Server-side only Supabase client.
 * Uses service role key — bypasses RLS.
 * NEVER import this in client components.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export const supabaseAdmin = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseServiceKey ?? 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

