'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

const PI_API_BASE = 'https://api.minepi.com'
const PI_API_KEY  = process.env.PI_API_KEY

/**
 * Approve a Pi payment on the server.
 * Called from onReadyForServerApproval callback.
 * This tells Pi Network the payment is legitimate.
 */
export async function approvePiPayment(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {

  if (!PI_API_KEY) {
    console.error('[ProofGrid:PiPayment] PI_API_KEY not configured')
    return { success: false, error: 'PI_API_KEY not configured' }
  }

  try {
    const response = await fetch(
      `${PI_API_BASE}/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const body = await response.text()
      console.error('[ProofGrid:PiPayment] Approval failed:', {
        paymentId,
        status: response.status,
        body,
      })
      return { success: false, error: `Pi API error: ${response.status}` }
    }

    console.log('[ProofGrid:PiPayment] Payment approved:', paymentId)
    return { success: true }

  } catch (err) {
    console.error('[ProofGrid:PiPayment] Network error during approval:', err)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Complete a Pi payment on the server.
 * Called from onReadyForServerCompletion callback.
 * Records the txid and marks the transaction confirmed.
 */
export async function completePiPayment(
  paymentId: string,
  txid:      string
): Promise<{ success: boolean; error?: string }> {

  if (!PI_API_KEY) {
    return { success: false, error: 'PI_API_KEY not configured' }
  }

  try {
    const response = await fetch(
      `${PI_API_BASE}/v2/payments/${paymentId}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      }
    )

    if (!response.ok) {
      const body = await response.text()
      console.error('[ProofGrid:PiPayment] Completion failed:', {
        paymentId,
        txid,
        status: response.status,
        body,
      })
      return { success: false, error: `Pi API error: ${response.status}` }
    }

    // Update Transaction record with confirmed txid
    await supabaseAdmin
      .from('Transaction')
      .update({
        txid:        txid,
        status:      'confirmed',
        confirmedAt: new Date().toISOString(),
      })
      .eq('piPaymentId', paymentId)

    console.log('[ProofGrid:PiPayment] Payment completed:', { paymentId, txid })
    return { success: true }

  } catch (err) {
    console.error('[ProofGrid:PiPayment] Network error during completion:', err)
    return { success: false, error: 'Network error' }
  }
}

