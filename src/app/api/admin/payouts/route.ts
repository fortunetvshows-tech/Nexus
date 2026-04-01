import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
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

    const { data: transactions } = await supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        status,
        netAmount,
        submissionId,
        txid,
        piPaymentId,
        createdAt,
        confirmedAt,
        submission:submissionId (
          id,
          workerId,
          task:taskId (
            id,
            title
          )
        )
      `)
      .eq('type', 'worker_payout')
      .order('createdAt', { ascending: false })
      .limit(50)

    // Enrich with worker data
    const enriched = await Promise.all(
      (transactions ?? []).map(async tx => {
        const workerId = (tx.submission as any)?.workerId
        if (!workerId) return { ...tx, worker: null, task: (tx.submission as any)?.task ?? null }

        const { data: worker } = await supabaseAdmin
          .from('User')
          .select('id, piUsername, piUid')
          .eq('id', workerId)
          .single()

        return {
          ...tx,
          worker: worker ?? null,
          task:   (tx.submission as any)?.task ?? null,
        }
      })
    )

    const summary = {
      totalPending:   enriched.filter(t => t.status === 'pending').length,
      totalConfirmed: enriched.filter(t => t.status === 'confirmed').length,
      totalFailed:    enriched.filter(t => t.status === 'failed').length,
      amountPending:  enriched
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.netAmount), 0),
      amountConfirmed: enriched
        .filter(t => t.status === 'confirmed')
        .reduce((sum, t) => sum + Number(t.netAmount), 0),
    }

    return NextResponse.json({
      success: true,
      payouts: enriched,
      summary,
    })

  } catch (err) {
    console.error('[ProofGrid:AdminPayouts] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

