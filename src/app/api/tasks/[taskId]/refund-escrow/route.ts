import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PLATFORM_CONFIG } from '@/lib/config/platform'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const piUid  = req.headers.get('x-pi-uid')

    if (!piUid) return NextResponse.json(
      { error: 'UNAUTHORIZED' }, { status: 401 }
    )

    // Get task and verify ownership
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select(`
        id, title, employerId, taskStatus,
        piReward, slotsAvailable, slotsRemaining,
        employer:employerId (piUid, piUsername)
      `)
      .eq('id', taskId)
      .single()

    if (!task) return NextResponse.json(
      { error: 'TASK_NOT_FOUND' }, { status: 404 }
    )

    // Verify caller is the employer
    if ((task.employer as any)?.piUid !== piUid) {
      return NextResponse.json(
        { error: 'FORBIDDEN — only employer can request refund' },
        { status: 403 }
      )
    }

    // Only refund archived or expired tasks
    if (!['archived', 'escrowed'].includes(task.taskStatus)) {
      return NextResponse.json(
        { error: 'TASK_NOT_REFUNDABLE — must be archived or escrowed' },
        { status: 400 }
      )
    }

    // Calculate refundable amount
    // slotsRemaining = slots that were never claimed and approved
    const refundablePi = Number(task.piReward) *
      Number(task.slotsRemaining)

    if (refundablePi <= 0) {
      return NextResponse.json({
        success: true,
        refunded: 0,
        message: 'No slots remaining — nothing to refund',
      })
    }

    // Get escrow ledger
    const { data: escrow } = await supabaseAdmin
      .from('EscrowLedger')
      .select('id, totalAmount, lockedAmount, releasedAmount')
      .eq('taskId', taskId)
      .single()

    if (!escrow) return NextResponse.json(
      { error: 'ESCROW_NOT_FOUND' }, { status: 404 }
    )

    // Calculate actual refundable from ledger
    const actualRefund = Math.max(
      0,
      Number(escrow.lockedAmount) - Number(escrow.releasedAmount)
    )

    if (actualRefund <= 0) {
      return NextResponse.json({
        success: true,
        refunded: 0,
        message: 'Escrow already fully released',
      })
    }

    // Get employer user record
    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!employer) return NextResponse.json(
      { error: 'EMPLOYER_NOT_FOUND' }, { status: 404 }
    )

    // Record refund transaction
    const { error: txError } = await supabaseAdmin
      .from('Transaction')
      .insert({
        senderId:    employer.id,
        recipientId: employer.id,
        taskId:      taskId,
        type:        'escrow_release',
        amount:      actualRefund,
        netAmount:   actualRefund,
        platformFee: 0,
        networkFee:  0,
        status:      'confirmed',
        confirmedAt: new Date().toISOString(),
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      })

    if (txError) {
      console.error('[Nexus:Refund] Transaction insert error:', txError)
      return NextResponse.json(
        { error: 'REFUND_RECORD_FAILED' }, { status: 500 }
      )
    }

    // Update escrow ledger — mark refund amount
    await supabaseAdmin
      .from('EscrowLedger')
      .update({
        refundAmount: actualRefund,
        lockedAmount: 0,
        status:       'closed',
        updatedAt:    new Date().toISOString(),
      })
      .eq('taskId', taskId)

    // Archive task if it was still escrowed
    if (task.taskStatus === 'escrowed') {
      await supabaseAdmin
        .from('Task')
        .update({
          taskStatus: 'archived',
          deletedAt:  new Date().toISOString(),
          updatedAt:  new Date().toISOString(),
        })
        .eq('id', taskId)
    }

    // Notify employer
    await supabaseAdmin
      .from('Notification')
      .insert({
        userId:   employer.id,
        type:     'task_approved',
        title:    '💰 Escrow refunded',
        body:     `${actualRefund.toFixed(2)}π has been returned from your task "${task.title}". Unused slots have been released.`,
        metadata: {
          taskId,
          refundAmount: actualRefund,
          type: 'escrow_refund',
        },
      })

    console.log('[Nexus:Refund] Escrow refunded:', {
      taskId,
      employer: piUid,
      refundAmount: actualRefund,
    })

    return NextResponse.json({
      success:      true,
      refunded:     actualRefund,
      message:      `${actualRefund.toFixed(2)}π refunded for ${task.slotsRemaining} unused slots`,
    })

  } catch (err: any) {
    console.error('[Nexus:Refund] Error:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
