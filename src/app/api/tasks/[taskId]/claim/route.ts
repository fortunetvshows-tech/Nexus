import { checkRateLimit }  from '@/lib/rate-limit'
import { supabaseAdmin }   from '@/lib/supabase-admin'
import { claimTaskSlot }   from '@/lib/services/submission-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const limited = await checkRateLimit(req, 'submission')
    if (limited) return limited

    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')

    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: worker } = await supabaseAdmin
      .from('User')
      .select('id, reputationScore, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!worker || worker.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const result = await claimTaskSlot(taskId, worker.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success:            true,
        reservationId:      result.reservationId,
        verificationCode:   result.verificationCode ?? null,
        timeoutAt:          result.timeoutAt,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:ClaimRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
