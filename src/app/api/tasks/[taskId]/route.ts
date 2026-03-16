import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')

    console.log('[Nexus:TaskRoute] GET taskId:', taskId, 'piUid:', piUid ? 'present' : 'missing')

    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Verify requesting user exists
    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Fetch task with correct column names matching our schema
    const { data: task, error: taskError } = await supabaseAdmin
      .from('Task')
      .select(`
        id,
        title,
        description,
        instructions,
        category,
        proofType,
        piReward,
        slotsAvailable,
        slotsRemaining,
        timeEstimateMin,
        deadline,
        minReputationReq,
        minBadgeLevel,
        taskStatus,
        tags,
        isFeatured,
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

    console.log('[Nexus:TaskRoute] Task query:', task ? 'found' : 'not found', taskError?.message ?? '')

    if (taskError || !task) {
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
