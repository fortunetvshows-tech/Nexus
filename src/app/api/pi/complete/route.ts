import { completePiPayment } from '@/lib/services/pi-payment-service'
import { NextRequest, NextResponse } from 'next/server'

// Called by client onReadyForServerCompletion callback
export async function POST(req: NextRequest) {
  try {
    const { paymentId, txid } = await req.json()

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: 'MISSING_PAYMENT_ID_OR_TXID' },
        { status: 400 }
      )
    }

    const result = await completePiPayment(paymentId, txid)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('[ProofGrid:PiComplete] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

