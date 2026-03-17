import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('expire_timed_out_slots')

    if (error) {
      console.error('[Nexus:Cron:ExpireSlots] RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const count = data as number
    console.log(`[Nexus:Cron:ExpireSlots] Expired ${count} slots`)

    return NextResponse.json(
      { success: true, expired: count },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:Cron:ExpireSlots] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
