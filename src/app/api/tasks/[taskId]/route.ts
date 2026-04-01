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
        instructionFileUrl,
        instructionFileName,
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

// PATCH — edit safe fields only
export async function PATCH(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    // Verify employer owns this task
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('id, employerId, taskStatus')
      .eq('id', taskId)
      .eq('employerId', user.id)
      .single()

    if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (task.taskStatus === 'archived') {
      return NextResponse.json({ error: 'Cannot edit archived task' }, { status: 400 })
    }

    const body = await req.json()

    // Only allow safe fields — never allow piReward, slotsAvailable, proofType
    const allowedFields: Record<string, unknown> = {}
    if (body.title        !== undefined) allowedFields.title        = body.title
    if (body.description  !== undefined) allowedFields.description  = body.description
    if (body.instructions !== undefined) allowedFields.instructions = body.instructions
    if (body.deadline     !== undefined) allowedFields.deadline     = body.deadline
    if (body.tags         !== undefined) allowedFields.tags         = body.tags

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
    }

    allowedFields.updatedAt = new Date().toISOString()

    const { data: updated, error } = await supabaseAdmin
      .from('Task')
      .update(allowedFields)
      .eq('id', taskId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    console.log('[Nexus:TaskRoute] Task updated:', taskId)
    return NextResponse.json({ success: true, task: updated })

  } catch (err) {
    console.error('[Nexus:TaskRoute] PATCH error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// DELETE — archive only, never hard delete
export async function DELETE(
  req:     NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    // Verify employer owns this task
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('id, employerId, taskStatus, slotsRemaining, slotsAvailable')
      .eq('id', taskId)
      .eq('employerId', user.id)
      .single()

    if (!task) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (task.taskStatus === 'archived') {
      return NextResponse.json({ error: 'Task already archived' }, { status: 400 })
    }

    // Archive — set status + deletedAt
    const { error } = await supabaseAdmin
      .from('Task')
      .update({
        taskStatus: 'archived',
        deletedAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Cancel all active slot reservations
    await supabaseAdmin
      .from('SlotReservation')
      .update({
        status:     'CANCELLED',
        updatedAt:  new Date().toISOString(),
      })
      .eq('taskId', taskId)
      .in('status', ['CLAIMED', 'ACTIVE', 'RESERVED'])

    console.log('[Nexus:TaskRoute] Task archived:', taskId)
    return NextResponse.json({
      success: true,
      message: 'Task archived. All existing submissions and payments continue normally.',
    })

  } catch (err) {
    console.error('[Nexus:TaskRoute] DELETE error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
