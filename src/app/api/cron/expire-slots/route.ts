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
      console.error('[ProofGrid:Cron:ExpireSlots] RPC error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const count = data as number
    console.log(`[ProofGrid:Cron:ExpireSlots] Expired ${count} slots`)

    // Auto-refund expired tasks with unused escrow
    const { data: expiredTasks } = await supabaseAdmin
      .from('Task')
      .select('id, piReward, slotsRemaining, employerId')
      .eq('taskStatus', 'escrowed')
      .lt('deadlineAt', new Date().toISOString())
      .gt('slotsRemaining', 0)

    for (const task of expiredTasks ?? []) {
      try {
        const refundAmount = Number(task.piReward) *
          Number(task.slotsRemaining)

        // Record refund transaction
        await supabaseAdmin
          .from('Transaction')
          .insert({
            senderId:    task.employerId,
            recipientId: task.employerId,
            taskId:      task.id,
            type:        'escrow_release',
            amount:      refundAmount,
            netAmount:   refundAmount,
            platformFee: 0,
            networkFee:  0,
            status:      'confirmed',
            confirmedAt: new Date().toISOString(),
            createdAt:   new Date().toISOString(),
            updatedAt:   new Date().toISOString(),
          })

        // Close escrow ledger
        await supabaseAdmin
          .from('EscrowLedger')
          .update({
            refundAmount: refundAmount,
            lockedAmount: 0,
            status:       'closed',
            updatedAt:    new Date().toISOString(),
          })
          .eq('taskId', task.id)

        // Archive the task
        await supabaseAdmin
          .from('Task')
          .update({
            taskStatus: 'archived',
            deletedAt:  new Date().toISOString(),
            updatedAt:  new Date().toISOString(),
          })
          .eq('id', task.id)

        // Get task title for notification
        const { data: taskData } = await supabaseAdmin
          .from('Task')
          .select('title')
          .eq('id', task.id)
          .single()

        // Notify employer
        await supabaseAdmin
          .from('Notification')
          .insert({
            userId:   task.employerId,
            type:     'task_approved',
            title:    '⏰ Task expired — escrow refunded',
            body:     `Your task expired with ${task.slotsRemaining} unused slots. ${refundAmount.toFixed(2)}π has been returned to your escrow balance.`,
            metadata: {
              taskId:       task.id,
              refundAmount,
              type:         'escrow_refund_auto',
            },
          })

        console.log('[ProofGrid:Cron] Auto-refunded expired task:', {
          taskId: task.id,
          refundAmount,
        })
      } catch (err) {
        console.error('[ProofGrid:Cron] Auto-refund failed for task:', task.id, err)
      }
    }

    return NextResponse.json(
      { success: true, expired: count },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Cron:ExpireSlots] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


