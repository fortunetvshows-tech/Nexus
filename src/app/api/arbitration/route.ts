import { supabaseAdmin }    from '@/lib/supabase-admin'
import { selectArbitrators } from '@/lib/services/arbitration-service'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/arbitration — trigger arbitrator selection for a dispute
// Called automatically after Tier 1 escalates
export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json()
    const { disputeId } = body as { disputeId: string }

    if (!disputeId) {
      return NextResponse.json(
        { error: 'MISSING_DISPUTE_ID' },
        { status: 400 }
      )
    }

    const result = await selectArbitrators(disputeId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status: result.code === 'NO_ELIGIBLE_ARBITRATORS' ? 400 : 500 }
      )
    }

    return NextResponse.json(
      {
        success:         true,
        arbitratorCount: result.arbitratorCount,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:ArbitrationRoute] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

