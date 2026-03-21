import { supabaseAdmin }  from '@/lib/supabase-admin'
import { payWorkerA2U }   from '@/lib/services/a2u-payment-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const { transactionIds } = await req.json()

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json({ error: 'MISSING_TRANSACTION_IDS' }, { status: 400 })
    }

    const results = []

    // Process ONE AT A TIME — Pi A2U requires sequential payments
    for (const txId of transactionIds) {

      // Fetch transaction with full context
      const { data: tx } = await supabaseAdmin
        .from('Transaction')
        .select(`
          id, type, status, netAmount, submissionId,
          submission:submissionId (
            id, workerId,
            task:taskId ( id, title )
          )
        `)
        .eq('id', txId)
        .eq('type', 'worker_payout')
        .eq('status', 'pending')
        .single()

      if (!tx) {
        results.push({ txId, success: false, error: 'NOT_FOUND_OR_ALREADY_PAID' })
        continue
      }

      // Get worker wallet address or Pi UID
      const { data: worker } = await supabaseAdmin
        .from('User')
        .select('piUid, piUsername, walletAddress')
        .eq('id', (tx.submission as any).workerId)
        .single()

      if (!worker) {
        results.push({ txId, success: false, error: 'WORKER_NOT_FOUND' })
        continue
      }

      const workerPiUid = worker.piUid ?? null
      if (!workerPiUid) {
        results.push({
          txId,
          worker:  worker.piUsername,
          amount:  Number(tx.netAmount),
          success: false,
          piTxid:  null,
          error:   'Worker piUid not found',
        })
        continue
      }

      const task = (tx.submission as any)?.task

      // Trigger A2U payment
      const payResult = await payWorkerA2U({
        workerPiUid,  // now uses walletAddress if available
        amount:       Number(tx.netAmount),
        submissionId: tx.submissionId,
        taskId:       task?.id ?? '',
        taskTitle:    task?.title ?? 'Nexus task',
      })

      results.push({
        txId,
        worker:  worker.piUsername,
        amount:  tx.netAmount,
        success: payResult.success,
        piTxid:  payResult.txid   ?? null,
        error:   payResult.error  ?? null,
      })

      // Wait 2 seconds between payments
      // Pi A2U requires sequential processing
      if (transactionIds.indexOf(txId) < transactionIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const succeeded = results.filter(r => r.success).length
    const failed    = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      summary: { succeeded, failed, total: results.length },
      results,
    })

  } catch (err) {
    console.error('[Nexus:RetryPayouts] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
