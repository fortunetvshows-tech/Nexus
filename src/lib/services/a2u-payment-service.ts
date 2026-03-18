'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import PiNetwork from 'pi-backend'

const PI_API_KEY = process.env.PI_API_KEY!
const WALLET_PRIVATE_SEED = process.env.WALLET_PRIVATE_SEED!

// Validate env vars on module load
if (!PI_API_KEY) {
  console.error('[Nexus:A2U] MISSING: PI_API_KEY')
}
if (!WALLET_PRIVATE_SEED) {
  console.error('[Nexus:A2U] MISSING: WALLET_PRIVATE_SEED')
}

const PI_API_BASE_URL = process.env.PI_SANDBOX === 'true'
  ? 'https://chapi.pi-testnet.com'
  : 'https://api.minepi.com'

/**
 * Pi A2U Payment Service
 * Handles server-side payments from platform wallet to worker wallets.
 * Uses Pi's App-to-User (A2U) payment API with platform's WALLET_PRIVATE_SEED for authentication.
 */

export interface A2UPaymentResult {
  success: boolean
  paymentId?: string
  txid?: string
  error?: string
  code?: string
}

/**
 * Create payment with Pi Network API
 * Returns paymentId that will be used to submit the transaction
 */
async function createPiPayment(params: {
  amount: number
  memo: string
  metadata: Record<string, string>
  uid: string
}): Promise<string> {
  if (!PI_API_KEY || !WALLET_PRIVATE_SEED) {
    throw new Error('Pi payment credentials not configured')
  }

  const payload = {
    amount: params.amount,
    memo: params.memo,
    metadata: params.metadata,
    uid: params.uid,
  }

  console.log('[Nexus:A2U] Creating payment with Pi API:', {
    url: `${PI_API_BASE_URL}/v2/payments`,
    amount: params.amount,
    uid: params.uid,
  })

  const response = await fetch(`${PI_API_BASE_URL}/v2/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[Nexus:A2U] Create payment failed:', error)
    throw new Error(`Pi API error: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  const paymentId = data.payment_id || data.id

  if (!paymentId) {
    throw new Error('Pi Network did not return a payment ID')
  }

  return paymentId
}

/**
 * Submit transaction to Pi Blockchain
 * Signs and submits the transaction from platform wallet to worker wallet
 */
async function submitPiTransaction(paymentId: string): Promise<string> {
  if (!PI_API_KEY || !WALLET_PRIVATE_SEED) {
    throw new Error('Pi payment credentials not configured')
  }

  const payload = {
    payment_id: paymentId,
    wallet_private_seed: WALLET_PRIVATE_SEED,
  }

  console.log('[Nexus:A2U] Submitting transaction to Pi Blockchain:', {
    url: `${PI_API_BASE_URL}/v2/payments/${paymentId}/submit`,
    paymentId,
  })

  const response = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[Nexus:A2U] Submit transaction failed:', error)
    throw new Error(`Pi API error: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  const txid = data.transaction_id || data.txid

  if (!txid) {
    throw new Error('Pi Blockchain did not return a transaction ID')
  }

  return txid
}

/**
 * Complete payment on Pi server
 * Marks payment as completed after blockchain confirmation
 */
async function completePiPayment(
  paymentId: string,
  txid: string
): Promise<Record<string, unknown>> {
  if (!PI_API_KEY) {
    throw new Error('Pi payment credentials not configured')
  }

  const payload = {
    payment_id: paymentId,
    transaction_id: txid,
  }

  console.log('[Nexus:A2U] Completing payment on Pi server:', {
    url: `${PI_API_BASE_URL}/v2/payments/${paymentId}/complete`,
    paymentId,
    txid,
  })

  const response = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('[Nexus:A2U] Complete payment failed:', error)
    throw new Error(`Pi API error: ${error.message || response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Pay a worker for completing a task.
 * Called server-side after approve_submission_atomic RPC succeeds.
 *
 * Flow:
 * 1. createPiPayment  — registers payment with Pi Network, returns paymentId
 * 2. submitPiTransaction — signs + submits transaction to Pi Blockchain, returns txid
 * 3. completePiPayment — marks payment complete on Pi server
 * 4. Update Transaction record in our DB
 */
export async function payWorkerA2U(params: {
  workerPiUid: string
  amount: number
  submissionId: string
  taskId: string
  taskTitle: string
}): Promise<A2UPaymentResult> {
  const { workerPiUid, amount, submissionId, taskId, taskTitle } = params

  if (!workerPiUid || !amount || !submissionId) {
    return {
      success: false,
      error: 'Missing required payment parameters',
      code: 'MISSING_PARAMS',
    }
  }

  if (amount <= 0) {
    return {
      success: false,
      error: 'Payment amount must be greater than 0',
      code: 'INVALID_AMOUNT',
    }
  }

  let paymentId: string | null = null
  let txid: string | null = null

  try {
    // Step 1 — Create payment with Pi Network
    // CRITICAL: Store paymentId immediately to prevent double-payment
    console.log('[Nexus:A2U] Creating payment:', {
      workerPiUid,
      amount,
      submissionId,
    })

    paymentId = await createPiPayment({
      amount,
      memo: `Nexus task payment: ${taskTitle.slice(0, 50)}`,
      metadata: {
        submissionId,
        taskId,
        type: 'worker_payout',
      },
      uid: workerPiUid,
    })

    if (!paymentId) {
      throw new Error('Pi Network did not return a payment ID')
    }

    // Store paymentId immediately — prevents double-payment on retry
    await supabaseAdmin
      .from('Transaction')
      .update({
        piPaymentId: paymentId,
        updatedAt: new Date().toISOString(),
      })
      .eq('submissionId', submissionId)
      .eq('type', 'worker_payout')
      .eq('status', 'pending')

    console.log('[Nexus:A2U] Payment created:', paymentId)

    // Step 2 — Submit transaction to Pi Blockchain
    txid = await submitPiTransaction(paymentId)

    if (!txid) {
      throw new Error('Pi Blockchain did not return a transaction ID')
    }

    console.log('[Nexus:A2U] Transaction submitted:', txid)

    // Store txid immediately
    await supabaseAdmin
      .from('Transaction')
      .update({
        txid: txid,
        updatedAt: new Date().toISOString(),
      })
      .eq('piPaymentId', paymentId)

    // Step 3 — Complete payment on Pi server
    const completedPayment = await completePiPayment(paymentId, txid)

    console.log('[Nexus:A2U] Payment completed:', {
      paymentId,
      txid,
      status: (completedPayment as any)?.status,
    })

    // Step 4 — Mark Transaction confirmed in our database
    await supabaseAdmin
      .from('Transaction')
      .update({
        status: 'confirmed',
        txid,
        piPaymentId: paymentId,
        confirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('submissionId', submissionId)
      .eq('type', 'worker_payout')

    // Update EscrowLedger — mark amount as released
    await supabaseAdmin
      .rpc('increment_released_amount', {
        p_task_id: taskId,
        p_amount: amount,
      })

    console.log('[Nexus:A2U] Worker paid successfully:', {
      workerPiUid,
      amount,
      txid,
    })

    return {
      success: true,
      paymentId,
      txid,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown payment error'

    console.error('[Nexus:A2U] Payment failed:', {
      workerPiUid,
      amount,
      submissionId,
      paymentId,
      txid,
      error: message,
    })

    // Log failed payment attempt for manual review
    try {
      await supabaseAdmin
        .from('AdminAction')
        .insert({
          actionType: 'a2u_payment_failed',
          targetType: 'submission',
          targetId: submissionId,
          notes: message,
          metadata: {
            workerPiUid,
            amount,
            paymentId,
            txid,
            timestamp: new Date().toISOString(),
          },
        })
    } catch (err) {
      console.error('[Nexus:A2U] Failed to log payment error:', err)
    }

    return {
      success: false,
      error: message,
      code: 'PAYMENT_FAILED',
    }
  }
}
