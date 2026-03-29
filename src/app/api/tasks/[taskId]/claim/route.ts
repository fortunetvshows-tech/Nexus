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
      .select('id, reputationScore, walletAddress, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!worker || worker.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get task details for validation
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('id, employerId, minReputation, deadlineAt, taskStatus')
      .eq('id', taskId)
      .single()

    if (!task) return NextResponse.json(
      { error: 'TASK_NOT_FOUND' }, { status: 404 }
    )

    // Check deadline
    if (new Date(task.deadlineAt) < new Date()) {
      return NextResponse.json(
        { error: 'TASK_EXPIRED' }, { status: 400 }
      )
    }

    // Check employer self-claim
    if (task.employerId === worker.id) {
      return NextResponse.json(
        { error: 'CANNOT_CLAIM_OWN_TASK' }, { status: 400 }
      )
    }

    // Check reputation
    if (worker.reputationScore < (task.minReputation ?? 0)) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_REPUTATION',
          required: task.minReputation,
          current: worker.reputationScore },
        { status: 403 }
      )
    }

    // Check wallet set
    if (!worker.walletAddress) {
      return NextResponse.json(
        { error: 'WALLET_REQUIRED',
          message: 'Please set your wallet address in Profile before claiming tasks' },
        { status: 400 }
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
