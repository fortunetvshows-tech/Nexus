'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import * as StellarSdk  from '@stellar/stellar-sdk'
import { NextRequest, NextResponse } from 'next/server'

const PI_API_KEY          = process.env.PI_API_KEY!
const WALLET_PRIVATE_SEED = process.env.WALLET_PRIVATE_SEED!
const PI_SANDBOX          = process.env.PI_SANDBOX === 'true'
const PI_API_BASE         = 'https://api.minepi.com'
const PI_HORIZON_URL      = PI_SANDBOX
  ? 'https://api.testnet.minepi.com'
  : 'https://api.mainnet.minepi.com'
const NETWORK_PASSPHRASE  = PI_SANDBOX ? 'Pi Testnet' : 'Pi Network'

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('id, isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { paymentId, toAddress, fromAddress, amount, submissionId } = await req.json()

    if (!paymentId) return NextResponse.json({ error: 'MISSING_PAYMENT_ID' }, { status: 400 })

    const keypair = StellarSdk.Keypair.fromSecret(WALLET_PRIVATE_SEED)
    const horizon = new StellarSdk.Horizon.Server(PI_HORIZON_URL)

    console.log('[ProofGrid:StuckPayment] Attempting to complete:', {
      paymentId, toAddress, fromAddress,
      ourPublicKey: keypair.publicKey(),
      match: fromAddress === keypair.publicKey(),
    })

    // Load account and build transaction
    const account    = await horizon.loadAccount(keypair.publicKey())
    const baseFee    = await horizon.fetchBaseFee()
    const timebounds = await horizon.fetchTimebounds(180)

    const paymentOp = StellarSdk.Operation.payment({
      destination: toAddress,
      asset:       StellarSdk.Asset.native(),
      amount:      amount.toString(),
    })

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee:               baseFee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds,
    })
      .addOperation(paymentOp)
      .addMemo(StellarSdk.Memo.text(paymentId))
      .build()

    transaction.sign(keypair)

    // Submit to Pi Horizon
    let txid: string
    try {
      const txResponse = await horizon.submitTransaction(transaction)
      txid = (txResponse as any).id ?? (txResponse as any).hash
      console.log('[ProofGrid:StuckPayment] Transaction submitted:', txid)
    } catch (stellarErr: any) {
      const detail = stellarErr?.response?.data?.extras?.result_codes ?? stellarErr?.message
      console.error('[ProofGrid:StuckPayment] Stellar error:', detail)
      return NextResponse.json({
        success: false,
        error:   'Stellar submission failed',
        detail,
        ourPublicKey: keypair.publicKey(),
        fromAddress,
        match: fromAddress === keypair.publicKey(),
      })
    }

    // Complete payment on Pi Network
    const completeRes = await fetch(
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

    if (!completeRes.ok) {
      const body = await completeRes.text()
      return NextResponse.json({
        success: false,
        error:   `Pi complete failed: ${completeRes.status}`,
        body,
        txid,
      })
    }

    // Update database
    if (submissionId) {
      await supabaseAdmin
        .from('Transaction')
        .update({
          status:      'confirmed',
          txid,
          piPaymentId: paymentId,
          confirmedAt: new Date().toISOString(),
          updatedAt:   new Date().toISOString(),
        })
        .eq('submissionId', submissionId)
        .eq('type', 'worker_payout')
    }

    return NextResponse.json({ success: true, txid, paymentId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ProofGrid:StuckPayment] Error:', message)
    return NextResponse.json({ success: false, error: message })
  }
}

