import { supabaseAdmin }          from '@/lib/supabase-admin'
import { getPendingArbitrations } from '@/lib/services/arbitration-service'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/arbitration/pending — get pending arbitrations for current user
export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { arbitrations, error } = await getPendingArbitrations(user.id)

    if (error) {
      return NextResponse.json({ error: 'FETCH_FAILED' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, arbitrations },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:ArbitrationPendingRoute] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}


