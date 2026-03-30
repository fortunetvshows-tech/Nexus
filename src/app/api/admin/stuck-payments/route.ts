'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { payWorkerA2U, cancelPiPayment } from '@/lib/services/a2u-payment-service'
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-pi-uid',
}

interface StuckPayment {
  id: string
  piPaymentId: string
  amount: number
  netAmount: number
  platformFee: number
  status: string
  createdAt: string
  receiverId: string
  worker: {
    id: string
    piUsername: string
    piUid: string
    walletAddress: string
  } | null
  task: {
    id: string
    title: string
  } | null
  submission: {
    id: string
    status: string
  } | null
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders })

    const { data: admin } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders })
    }

    // Get transactions that are:
    // 1. Pending and created more than 1 hour ago (stuck payments)
    // 2. Failed but created recently (<24 hours, available for retry)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Fetch pending >1hour old
    const { data: pendingStuck } = await supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        piPaymentId,
        amount,
        netAmount,
        platformFee,
        status,
        createdAt,
        receiverId,
        taskId,
        submissionId,
        user:receiverId (
          id,
          piUsername,
          piUid,
          walletAddress
        ),
        task:taskId (
          id,
          title
        ),
        submission:submissionId (
          id,
          status
        )
      `)
      .eq('type', 'worker_payout')
      .eq('status', 'pending')
      .lt('createdAt', oneHourAgo)

    // Fetch failed <24 hours old (recently cleared/available for retry)
    const { data: recentlyFailed } = await supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        piPaymentId,
        amount,
        netAmount,
        platformFee,
        status,
        createdAt,
        receiverId,
        taskId,
        submissionId,
        user:receiverId (
          id,
          piUsername,
          piUid,
          walletAddress
        ),
        task:taskId (
          id,
          title
        ),
        submission:submissionId (
          id,
          status
        )
      `)
      .eq('type', 'worker_payout')
      .eq('status', 'failed')
      .gt('createdAt', oneDayAgo)

    // Combine and sort
    const stuckPayments = [...(pendingStuck || []), ...(recentlyFailed || [])]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Format response
    const formatted = (stuckPayments || []).map((tx: any) => ({
      id: tx.id,
      piPaymentId: tx.piPaymentId,
      amount: tx.amount,
      netAmount: tx.netAmount,
      platformFee: tx.platformFee,
      status: tx.status,
      createdAt: tx.createdAt,
      receiverId: tx.receiverId,
      worker: tx.user
        ? {
            id: tx.user.id,
            piUsername: tx.user.piUsername,
            piUid: tx.user.piUid,
            walletAddress: tx.user.walletAddress,
          }
        : null,
      task: tx.task,
      submission: tx.submission,
    }))

    return NextResponse.json(
      {
        success: true,
        count: formatted.length,
        payments: formatted,
      },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[Nexus:StuckPayments] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders })

    const { data: admin } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders })
    }

    const { action, paymentIds } = await req.json()

    if (!action || !paymentIds || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing action or paymentIds' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (action === 'clear_stuck') {
      // Mark payments as failed (clears stuck payment)
      const { error: updateError } = await supabaseAdmin
        .from('Transaction')
        .update({
          status: 'failed',
        })
        .in('id', paymentIds)
        .eq('status', 'pending')

      if (updateError) {
        console.error('[Nexus:StuckPayments:POST] Update error:', {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        return NextResponse.json(
          { 
            error: 'Failed to clear payments', 
            detail: updateError.message,
            code: updateError.code,
          },
          { status: 500, headers: corsHeaders }
        )
      }

      console.log('[Nexus:Admin] Cleared stuck payments:', {
        count: paymentIds.length,
        paymentIds,
        admin: piUid,
      })

      return NextResponse.json(
        {
          success: true,
          message: `Cleared ${paymentIds.length} stuck payment(s)`,
          clearedCount: paymentIds.length,
        },
        { headers: corsHeaders }
      )
    }

    if (action === 'retry_stuck') {
      // Retry failed/cleared payments by marking them as pending and attempting payout
      const results = []

      for (const paymentId of paymentIds) {
        try {
          // Fetch failed transaction details
          const { data: tx } = await supabaseAdmin
            .from('Transaction')
            .select(`
              id, status, netAmount, receiverId, submissionId,
              submission:submissionId (
                id, workerId, taskId,
                task:taskId ( id, title )
              )
            `)
            .eq('id', paymentId)
            .eq('type', 'worker_payout')
            .single()

          if (!tx) {
            results.push({ paymentId, success: false, error: 'NOT_FOUND' })
            continue
          }

          // Get worker details
          const { data: worker } = await supabaseAdmin
            .from('User')
            .select('id, piUid, piUsername, walletAddress')
            .eq('id', (tx.submission as any).workerId)
            .single()

          if (!worker?.piUid || !worker?.walletAddress) {
            results.push({
              paymentId,
              success: false,
              error: 'Worker missing piUid or wallet',
              worker: worker?.piUsername,
            })
            continue
          }

          // Mark as pending
          await supabaseAdmin
            .from('Transaction')
            .update({ status: 'pending' })
            .eq('id', paymentId)

          // Attempt payment
          let paymentResult = await payWorkerA2U({
            workerPiUid: worker.piUid,
            workerWallet: worker.walletAddress,
            amount: Number(tx.netAmount),
            submissionId: (tx.submission as any).id,
            taskId: (tx.submission as any).task.id,
            taskTitle: (tx.submission as any).task.title,
          })

          // If ongoing_payment_found error, cancel the existing payment and retry
          if (!paymentResult.success && paymentResult.error?.includes('ongoing_payment_found')) {
            try {
              // Extract existing payment ID from piPaymentId field in transaction
              const { data: existingTx } = await supabaseAdmin
                .from('Transaction')
                .select('piPaymentId')
                .eq('submissionId', (tx.submission as any).id)
                .eq('type', 'worker_payout')
                .neq('status', 'confirmed')
                .order('createdAt', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (existingTx?.piPaymentId) {
                console.log('[Nexus:Admin] Found existing payment, attempting to cancel:', existingTx.piPaymentId)
                const cancelResult = await cancelPiPayment(existingTx.piPaymentId)

                if (cancelResult.success) {
                  console.log('[Nexus:Admin] Cancelled existing payment, retrying new one')
                  // Retry the payment
                  paymentResult = await payWorkerA2U({
                    workerPiUid: worker.piUid,
                    workerWallet: worker.walletAddress,
                    amount: Number(tx.netAmount),
                    submissionId: (tx.submission as any).id,
                    taskId: (tx.submission as any).task.id,
                    taskTitle: (tx.submission as any).task.title,
                  })
                }
              }
            } catch (cancelErr: any) {
              console.error('[Nexus:Admin] Error during cancel+retry:', cancelErr.message)
            }
          }

          if (paymentResult.success) {
            results.push({
              paymentId,
              success: true,
              worker: worker.piUsername,
              amount: Number(tx.netAmount),
              piPaymentId: paymentResult.paymentId,
            })
          } else {
            results.push({
              paymentId,
              success: false,
              error: paymentResult.error,
              worker: worker.piUsername,
            })
          }
        } catch (err: any) {
          results.push({
            paymentId,
            success: false,
            error: err.message,
          })
        }
      }

      const successCount = results.filter((r: any) => r.success).length

      return NextResponse.json(
        {
          success: successCount > 0,
          message: `Retried ${paymentIds.length} payment(s): ${successCount} success`,
          results,
        },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders })
  } catch (err: any) {
    console.error('[Nexus:StuckPayments:POST] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500, headers: corsHeaders })
  }
}
