import { checkRateLimit }       from '@/lib/rate-limit'
import { PLATFORM_CONFIG }       from '@/lib/config/platform'
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
    const netAmount = PLATFORM_CONFIG.workerNetPayout(
      Number(submission.agreedReward)
    )

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
    console.log('[ProofGrid:Approve] Triggering A2U payment:', {
      workerPiUid,
      workerWallet,
      netAmount,
      submissionId,
    })

    const paymentResult = await payWorkerA2U({
      workerPiUid,
      workerWallet,  // Pass stored wallet to avoid Pi scope errors
      amount: netAmount,
      submissionId,
      taskId: task.id,
      taskTitle: task.title,
    })

    // Update notification with actual earned amount and fee breakdown
    if (paymentResult.success) {
      const grossAmount = Number(submission.agreedReward)
      const feeAmount = PLATFORM_CONFIG.platformFee(grossAmount)
      const actualReceived = netAmount

      // Build comprehensive notification with fee breakdown
      const title = `You earned ${actualReceived.toFixed(2)}π! 🎉`
      const networkFeeDisplay = PLATFORM_CONFIG.NETWORK_FEE_PI > 0 ? ` − ${PLATFORM_CONFIG.NETWORK_FEE_PI}π network fee` : ''
      const body = `Your work was approved! You earned ${actualReceived.toFixed(2)}π (${grossAmount.toFixed(2)}π − ${feeAmount.toFixed(2)}π platform fee${networkFeeDisplay})`
      const metadata = {
        submissionId,
        grossAmount,
        platformFee: feeAmount,
        netAmount: actualReceived,
        status: 'approved',
        timestamp: new Date().toISOString(),
      }

      try {
        // Find notification by submissionId stored in metadata (reliable query)
        const { data: existingNotif, error: fetchErr } = await supabaseAdmin
          .from('Notification')
          .select('id')
          .eq('userId', submission.workerId)
          .eq('type', 'task_approved')
          .filter('metadata->submissionId', 'eq', `"${submissionId}"`)
          .maybeSingle()

        if (fetchErr) {
          console.error('[ProofGrid:Approve] Failed to find notification:', { submissionId, error: fetchErr })
        }

        if (existingNotif?.id) {
          // Update with complete fee breakdown
          const { error: updateErr } = await supabaseAdmin
            .from('Notification')
            .update({
              title,
              body,
              metadata,
            })
            .eq('id', existingNotif.id)

          if (updateErr) {
            console.error('[ProofGrid:Approve] Failed to update notification with fee breakdown:', {
              submissionId,
              notificationId: existingNotif.id,
              error: updateErr,
            })
          } else {
            console.log('[ProofGrid:Approve] Successfully updated notification with fee breakdown:', {
              submissionId,
              grossAmount,
              platformFee: feeAmount,
              netAmount: actualReceived,
            })
          }
        } else {
          // Fallback: Create new notification if find failed (shouldn't happen normally)
          console.warn('[ProofGrid:Approve] Original notification not found, creating new one:', { submissionId })
          const { error: insertErr } = await supabaseAdmin
            .from('Notification')
            .insert({
              userId: submission.workerId,
              type: 'task_approved',
              title,
              body,
              metadata,
              isRead: false,
            })

          if (insertErr) {
            console.error('[ProofGrid:Approve] Failed to create fallback notification:', { submissionId, error: insertErr })
          }
        }
      } catch (err) {
        console.error('[ProofGrid:Approve] Unexpected error during notification update:', {
          submissionId,
          error: err instanceof Error ? err.message : String(err),
        })
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
        console.error('[ProofGrid:Approve] Referral reward failed:', refError)
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
    console.error('[ProofGrid:ApproveRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


