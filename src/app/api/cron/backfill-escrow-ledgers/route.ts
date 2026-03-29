import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Backfill missing EscrowLedger records for tasks
 * This fixes tasks that were created before EscrowLedger was implemented
 * 
 * Scans all tasks and creates ledger entries for those missing them
 * Calculates:
 * - lockedAmount = piReward × slotsAvailable (original escrow)
 * - releasedAmount = sum of paid worker_payout transactions for the task
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET
    
    // Protect endpoint from unauthorized calls
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    console.log('[Nexus:BackfillEscrow] Starting escrow ledger backfill...')

    // Step 1: Get all tasks
    const { data: allTasks, error: tasksError } = await supabaseAdmin
      .from('Task')
      .select('id, piReward, slotsAvailable, taskStatus')
      .order('createdAt', { ascending: false })

    if (tasksError || !allTasks) {
      return NextResponse.json(
        { error: 'FETCH_TASKS_FAILED', details: tasksError?.message },
        { status: 500 }
      )
    }

    console.log(`[Nexus:BackfillEscrow] Found ${allTasks.length} tasks`)

    // Step 2: Get all existing EscrowLedgers
    const { data: existingLedgers } = await supabaseAdmin
      .from('EscrowLedger')
      .select('taskId')

    const ledgerTaskIds = new Set((existingLedgers ?? []).map(l => l.taskId))

    // Step 3: Find tasks missing ledgers
    const missingTasks = allTasks.filter(t => !ledgerTaskIds.has(t.id))
    console.log(`[Nexus:BackfillEscrow] Found ${missingTasks.length} tasks missing EscrowLedger`)

    if (missingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All tasks have EscrowLedger records',
        tasksProcessed: 0,
      })
    }

    // Step 4: For each missing task, calculate released amount from transactions
    const ledgersToCreate = []

    for (const task of missingTasks) {
      // Get all confirmed worker_payout transactions for this task
      const { data: transactions } = await supabaseAdmin
        .from('Transaction')
        .select('amount')
        .eq('taskId', task.id)
        .eq('type', 'worker_payout')
        .eq('status', 'confirmed')

      const releasedAmount = (transactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      const lockedAmount = Number(task.piReward) * Number(task.slotsAvailable)

      ledgersToCreate.push({
        taskId: task.id,
        totalAmount: lockedAmount,
        lockedAmount: Math.max(0, lockedAmount - releasedAmount),
        releasedAmount: releasedAmount,
        refundAmount: null,
        status: task.taskStatus === 'archived' ? 'closed' : 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log(`[Nexus:BackfillEscrow] Task ${task.id}: locked=${lockedAmount}, released=${releasedAmount}`)
    }

    // Step 5: Insert all missing ledgers
    if (ledgersToCreate.length > 0) {
      const { error: insertError, data: inserted } = await supabaseAdmin
        .from('EscrowLedger')
        .insert(ledgersToCreate)
        .select()

      if (insertError) {
        console.error('[Nexus:BackfillEscrow] Insert failed:', insertError)
        return NextResponse.json(
          { error: 'INSERT_FAILED', details: insertError.message },
          { status: 500 }
        )
      }

      console.log(`[Nexus:BackfillEscrow] Successfully created ${inserted?.length ?? 0} EscrowLedger records`)

      return NextResponse.json({
        success: true,
        message: `Backfilled ${inserted?.length ?? 0} EscrowLedger records`,
        tasksProcessed: inserted?.length ?? 0,
        ledgers: inserted,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No ledgers needed creation',
      tasksProcessed: 0,
    })

  } catch (err) {
    console.error('[Nexus:BackfillEscrow] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', details: String(err) },
      { status: 500 }
    )
  }
}
