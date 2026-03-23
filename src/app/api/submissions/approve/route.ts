import { checkRateLimit }       from '@/lib/rate-limit'
import { supabaseAdmin }         from '@/lib/supabase-admin'
import { approveSubmission }     from '@/lib/services/escrow-service'
import { payWorkerA2U }          from '@/lib/services/a2u-payment-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest
) {
  try {
    const limited = await checkRateLimit(req, 'submission')
    if (limited) return limited

    const piUid = req.headers.get('x-pi-uid')

    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!employer || employer.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { submissionId, qualityRating } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'MISSING_SUBMISSION_ID' },
        { status: 400 }
      )
    }

    // Verify submission exists and get details
    const { data: submission } = await supabaseAdmin
      .from('Submission')
      .select('id, workerId, taskId, status, agreedReward')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Verify task belongs to employer
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('id, employerId, title')
      .eq('id', submission.taskId)
      .single()

    if (!task || task.employerId !== employer.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Check idempotency — if already paid, return success with alreadyPaid flag
    const { data: existingConfirmed } = await supabaseAdmin
      .from('Transaction')
      .select('id, status, txid')
      .eq('submissionId', submissionId)
      .eq('type', 'worker_payout')
      .eq('status', 'confirmed')
      .maybeSingle()

    if (existingConfirmed) {
      return NextResponse.json({
        success: true,
        paymentSent: true,
        alreadyPaid: true,
        txid: existingConfirmed.txid,
      }, { status: 200 })
    }

    const result = await approveSubmission(
      submissionId,
      employer.id,
      qualityRating || 5
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Get worker's wallet address or Pi UID for A2U payment
    const { data: worker } = await supabaseAdmin
      .from('User')
      .select('piUid, piUsername, walletAddress')
      .eq('id', submission.workerId)
      .single()

    // A2U needs Pi UID (to identify user) AND wallet address (for Stellar tx)
    const workerPiUid = worker?.piUid ?? null
    const workerWallet = worker?.walletAddress ?? null
    const netAmount = Number(submission.agreedReward) * 0.95 // 5% platform fee

    if (!workerPiUid) {
      return NextResponse.json({
        success: false,
        error:   'WORKER_NOT_FOUND',
      })
    }

    if (!workerWallet) {
      return NextResponse.json({
        success:     true,
        paymentSent: false,
        warning:     `Worker ${worker?.piUsername} has not set their wallet address. Ask them to visit their Profile page to add it before payment can be processed.`,
      })
    }

    // Trigger A2U payment from platform wallet to worker
    console.log('[Nexus:Approve] Triggering A2U payment:', {
      workerPiUid,
      netAmount,
      submissionId,
    })

    const paymentResult = await payWorkerA2U({
      workerPiUid,
      amount: netAmount,
      submissionId,
      taskId: task.id,
      taskTitle: task.title,
    })

    // Update notification with actual earned amount
    if (paymentResult.success) {
      try {
        const grossAmount = Number(submission.agreedReward)
        const feeAmount = Number(submission.agreedReward) * 0.05
        const networkFee = 0.01
        const actualReceived = netAmount - networkFee

        await supabaseAdmin
          .from('Notification')
          .update({
            title: `You earned ${actualReceived.toFixed(2)}π! 🎉`,
            body: `Your work was approved! You earned ${actualReceived.toFixed(2)}π (${grossAmount.toFixed(2)}π − ${feeAmount.toFixed(2)}π platform fee − 0.01π network fee)`,
          })
          .eq('userId', submission.workerId)
          .eq('type', 'task_approved')
          .order('createdAt', { ascending: false })
          .limit(1)
      } catch (err) {
        console.error('[Nexus:Approve] Failed to update notification:', err)
      }

      // Handle referral reward if this is first approved submission
      try {
        // Count approved submissions for this worker
        const { count: approvedCount } = await supabaseAdmin
          .from('Submission')
          .select('*', { count: 'exact', head: true })
          .eq('workerId', submission.workerId)
          .eq('status', 'APPROVED')

        // If this is their first approval, check for referrer
        if (approvedCount === 1) {
          const { data: worker } = await supabaseAdmin
            .from('User')
            .select('id, referredBy')
            .eq('id', submission.workerId)
            .single()

          if (worker?.referredBy) {
            // Find referrer
            const { data: referrer } = await supabaseAdmin
              .from('User')
              .select('id')
              .eq('piUid', worker.referredBy)
              .single()

            if (referrer) {
              // Create referral record
              const referralReward = 0.5
              await supabaseAdmin
                .from('ReferralRecord')
                .insert({
                  referrerId: referrer.id,
                  referredUserId: submission.workerId,
                  status: 'qualified',
                  rewardAmount: referralReward,
                })

              // Create notification for referrer
              await supabaseAdmin
                .from('Notification')
                .insert({
                  userId: referrer.id,
                  type: 'referral_qualified',
                  title: 'Your referral earned their first approval! 🎉',
                  body: `You earned ${referralReward.toFixed(4)}π from your referral's first approved task!`,
                  isRead: false,
                })
            }
          }
        }
      } catch (refError) {
        // Referral reward logic must never block the main payment flow
        console.error('[Nexus:Approve] Referral reward failed:', refError)
      }
    }

    return NextResponse.json({
      success: true,
      paymentSent: paymentResult.success,
      txid: paymentResult.txid ?? null,
      paymentId: paymentResult.paymentId ?? null,
      amount: netAmount,
      warning: paymentResult.success
        ? null
        : `Payment failed: ${paymentResult.error}. Worker will be paid manually.`,
    }, { status: 200 })

  } catch (err) {
    console.error('[Nexus:ApproveRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
