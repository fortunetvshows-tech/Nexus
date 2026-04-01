'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import * as StellarSdk  from '@stellar/stellar-sdk'

const PI_API_KEY          = process.env.PI_API_KEY!
const WALLET_PRIVATE_SEED = process.env.WALLET_PRIVATE_SEED!
const PI_SANDBOX          = process.env.PI_SANDBOX === 'true'

const PI_API_BASE     = 'https://api.minepi.com'
const PI_HORIZON_URL  = PI_SANDBOX
  ? 'https://api.testnet.minepi.com'
  : 'https://api.mainnet.minepi.com'
const NETWORK_PASSPHRASE = PI_SANDBOX
  ? 'Pi Testnet'
  : 'Pi Network'

function getKeypair(): StellarSdk.Keypair {
  if (!WALLET_PRIVATE_SEED) throw new Error('WALLET_PRIVATE_SEED not configured')
  return StellarSdk.Keypair.fromSecret(WALLET_PRIVATE_SEED)
}

export interface A2UPaymentResult {
  success:    boolean
  paymentId?: string
  txid?:      string
  error?:     string
  code?:      string
}

// ── Step 1: Register payment with Pi Network ─────────────────
async function createPiPayment(params: {
  amount:    number
  memo:      string
  metadata:  Record<string, unknown>
  uid:       string
  toAddress: string  // Worker's wallet address (Stellar public key)
}): Promise<string> {
  const res = await fetch(`${PI_API_BASE}/v2/payments`, {
    method:  'POST',
    headers: {
      Authorization:  `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment: {
        amount:     params.amount,
        memo:       params.memo,
        metadata:   params.metadata,
        uid:        params.uid,
        to_address: params.toAddress,  // Pass stored wallet to avoid scope errors
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pi createPayment failed: ${res.status} — ${body}`)
  }

  const data = await res.json()
  const paymentId = data?.identifier ?? data?.payment?.identifier ?? null

  if (!paymentId) {
    throw new Error(`Pi createPayment returned no identifier: ${JSON.stringify(data)}`)
  }

  return paymentId
}

// ── Step 2: Get payment details from Pi Network ──────────────
async function getPiPayment(paymentId: string): Promise<{
  amount:       number
  identifier:   string
  from_address: string
  to_address:   string
  network:      string
  transaction?: { txid: string } | null
}> {
  const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}`, {
    headers: { Authorization: `Key ${PI_API_KEY}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pi getPayment failed: ${res.status} — ${body}`)
  }

  return res.json()
}

// ── Step 3: Build + sign + submit Stellar transaction ────────
async function submitStellarTransaction(paymentDetails: {
  amount:            number
  identifier:        string
  from_address:      string
  to_address:        string
}): Promise<string> {
  const keypair  = getKeypair()
  const horizon  = new StellarSdk.Horizon.Server(PI_HORIZON_URL)

  // Verify from_address matches our wallet
  if (paymentDetails.from_address !== keypair.publicKey()) {
    throw new Error(
      `from_address mismatch. Expected: ${keypair.publicKey()}, got: ${paymentDetails.from_address}`
    )
  }

  // Load account for sequence number
  const account  = await horizon.loadAccount(keypair.publicKey())
  const baseFee  = await horizon.fetchBaseFee()
  const timebounds = await horizon.fetchTimebounds(180)

  // Build payment operation
  const paymentOp = StellarSdk.Operation.payment({
    destination: paymentDetails.to_address,
    asset:       StellarSdk.Asset.native(),
    amount:      paymentDetails.amount.toString(),
  })

  // Build and sign transaction
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee:               baseFee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds,
  })
    .addOperation(paymentOp)
    .addMemo(StellarSdk.Memo.text(paymentDetails.identifier))
    .build()

  transaction.sign(keypair)

  // Submit to Pi Horizon
  let txResponse: any
  try {
    txResponse = await horizon.submitTransaction(transaction)
  } catch (horizonErr: any) {
    // Extract detailed Stellar error codes
    const resultCodes = horizonErr?.response?.data?.extras?.result_codes
    const envelopeXdr = horizonErr?.response?.data?.extras?.envelope_xdr
    const resultXdr   = horizonErr?.response?.data?.extras?.result_xdr
    const errMessage  = JSON.stringify({
      resultCodes,
      status:      horizonErr?.response?.status,
      title:       horizonErr?.response?.data?.title,
      envelopeXdr: envelopeXdr?.slice(0, 100),
    })
    throw new Error(`Stellar Horizon rejected transaction: ${errMessage}`)
  }
  const txid = (txResponse as any).id ?? (txResponse as any).hash

  if (!txid) {
    throw new Error(`Stellar transaction submitted but no txid returned`)
  }

  return txid
}

// ── Step 4: Complete payment on Pi Network ───────────────────
async function completePiPayment(
  paymentId: string,
  txid:      string
): Promise<void> {
  const res = await fetch(
    `${PI_API_BASE}/v2/payments/${paymentId}/complete`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pi completePayment failed: ${res.status} — ${body}`)
  }
}

// ── Main entry point ─────────────────────────────────────────
export async function payWorkerA2U(params: {
  workerPiUid:  string
  workerWallet: string  // Worker's Stellar wallet address (from User.walletAddress)
  amount:       number
  submissionId: string
  taskId:       string
  taskTitle:    string
}): Promise<A2UPaymentResult> {

  const { workerPiUid, workerWallet, amount, submissionId, taskId, taskTitle } = params

  if (!workerPiUid || !workerWallet || !amount || !submissionId) {
    return { success: false, error: 'Missing required parameters (wallet required)', code: 'MISSING_PARAMS' }
  }

  if (amount <= 0) {
    return { success: false, error: 'Amount must be greater than 0', code: 'INVALID_AMOUNT' }
  }

  if (!PI_API_KEY) {
    return { success: false, error: 'PI_API_KEY not configured', code: 'CONFIG_ERROR' }
  }

  if (!WALLET_PRIVATE_SEED) {
    return { success: false, error: 'WALLET_PRIVATE_SEED not configured', code: 'CONFIG_ERROR' }
  }

  let paymentId: string | null = null
  let txid:      string | null = null

  try {
    console.log('[ProofGrid:A2U] Starting payment:', {
      workerPiUid,
      amount,
      submissionId,
      sandbox: PI_SANDBOX,
    })

    // Step 1 — Create payment
    paymentId = await createPiPayment({
      amount,
      memo:      `Nexus: ${taskTitle.slice(0, 40)}`,
      metadata:  { submissionId, taskId, type: 'worker_payout' },
      uid:       workerPiUid,
      toAddress: workerWallet,  // Use stored wallet address instead of relying on scopes
    })

    console.log('[ProofGrid:A2U] Payment created:', paymentId)

    // Store paymentId immediately — prevents double payment
    await supabaseAdmin
      .from('Transaction')
      .update({ piPaymentId: paymentId, updatedAt: new Date().toISOString() })
      .eq('submissionId', submissionId)
      .eq('type', 'worker_payout')
      .eq('status', 'pending')

    // Step 2 — Get payment details for Stellar transaction
    const paymentDetails = await getPiPayment(paymentId)

    // Check if already submitted
    if (paymentDetails.transaction?.txid) {
      txid = paymentDetails.transaction.txid
      console.log('[ProofGrid:A2U] Payment already has txid:', txid)
    } else {
      // Step 3 — Build, sign and submit Stellar transaction
      txid = await submitStellarTransaction({
        amount:       paymentDetails.amount,
        identifier:   paymentDetails.identifier,
        from_address: paymentDetails.from_address,
        to_address:   paymentDetails.to_address,
      })
      console.log('[ProofGrid:A2U] Transaction submitted:', txid)
    }

    // Store txid immediately
    await supabaseAdmin
      .from('Transaction')
      .update({ txid, updatedAt: new Date().toISOString() })
      .eq('piPaymentId', paymentId)

    // Step 4 — Complete payment on Pi Network
    await completePiPayment(paymentId, txid)
    console.log('[ProofGrid:A2U] Payment completed:', { paymentId, txid })

    // Step 5 — Mark confirmed in database
    await supabaseAdmin
      .from('Transaction')
      .update({
        status:      'confirmed',
        confirmedAt: new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      })
      .eq('piPaymentId', paymentId)

    // Also confirm platform fee transaction
    await supabaseAdmin
      .from('Transaction')
      .update({
        status:      'confirmed',
        updatedAt:   new Date().toISOString(),
      })
      .eq('submissionId', submissionId)
      .eq('type', 'platform_fee')
      .eq('status', 'pending')

    // Step 6 — Update EscrowLedger
    await supabaseAdmin.rpc('increment_released_amount', {
      p_task_id: taskId,
      p_amount:  amount,
    })

    console.log('[ProofGrid:A2U] Worker paid successfully:', {
      workerPiUid, amount, txid,
    })

    return { success: true, paymentId, txid }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    console.error('[ProofGrid:A2U] Payment failed:', {
      workerPiUid, amount, submissionId,
      paymentId, txid, error: message,
    })

    // Log to AdminAction for manual recovery
    try {
      await supabaseAdmin
        .from('AdminAction')
        .insert({
          actionType: 'a2u_payment_failed',
          targetType: 'submission',
          targetId:   submissionId,
          notes:      message,
          metadata:   {
            workerPiUid, amount, paymentId, txid,
            sandbox:   PI_SANDBOX,
            timestamp: new Date().toISOString(),
          },
        })
    } catch (logErr) {
      console.error('[ProofGrid:A2U] Failed to log AdminAction:', logErr)
    }

    return { success: false, error: message, code: 'PAYMENT_FAILED' }
  }
}

// ── Cancel an incomplete payment ──────────────────────────────
export async function cancelPiPayment(paymentId: string): Promise<A2UPaymentResult> {
  if (!PI_API_KEY) {
    return { success: false, error: 'PI_API_KEY not configured', code: 'CONFIG_ERROR' }
  }

  try {
    console.log('[ProofGrid:A2U] Cancelling payment:', paymentId)

    const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Pi cancelPayment failed: ${res.status} — ${body}`)
    }

    console.log('[ProofGrid:A2U] Payment cancelled successfully:', paymentId)
    return { success: true, paymentId }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ProofGrid:A2U] Cancel failed:', { paymentId, error: message })
    return { success: false, error: message, code: 'CANCEL_FAILED' }
  }
}

