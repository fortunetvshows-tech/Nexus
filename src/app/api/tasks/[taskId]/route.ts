import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')

    console.log('[Nexus:TaskRoute] GET taskId:', taskId, 'piUid:', piUid)

    if (!piUid) {
      console.log('[Nexus:TaskRoute] No piUid header — returning 401')
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    console.log('[Nexus:TaskRoute] User lookup:', user?.id ?? 'NOT FOUND', userError?.message ?? 'no error')

    if (!user) {
      console.log('[Nexus:TaskRoute] User not found — returning 401')
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: task, error: taskError } = await supabaseAdmin
      .from('Task')
      .select(`
        id, title, description, instructions,
        category, proofType, piReward,
        slotsAvailable, slotsRemaining,
        timeEstimateMin, deadline,
        minReputationReq, minBadgeLevel,
        taskStatus, tags, isFeatured,
        employer:employerId (
          piUsername,
          reputationScore,
          reputationLevel
        )
      `)
      .eq('id', taskId)
      .eq('taskStatus', 'escrowed')
      .is('deletedAt', null)
      .single()

    console.log('[Nexus:TaskRoute] Task query result:', task?.id ?? 'NOT FOUND', taskError?.message ?? 'no error', taskError?.code ?? '')

    if (taskError || !task) {
      console.log('[Nexus:TaskRoute] Task not found — returning 404')
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, task },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:TaskRoute] Unhandled error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
