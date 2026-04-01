import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron — not a public user
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('auto_approve_submissions')

    if (error) {
      console.error('[ProofGrid:Cron:AutoApprove] RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const count = data as number
    console.log(`[ProofGrid:Cron:AutoApprove] Approved ${count} submissions`)

    return NextResponse.json(
      { success: true, approved: count },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Cron:AutoApprove] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

