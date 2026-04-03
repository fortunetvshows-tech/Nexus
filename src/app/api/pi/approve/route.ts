import { approvePiPayment } from '@/lib/services/pi-payment-service'
import { NextRequest, NextResponse } from 'next/server'

// Called by client onReadyForServerApproval callback
export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'MISSING_PAYMENT_ID' },
        { status: 400 }
      )
    }

    const result = await approvePiPayment(paymentId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error('[ProofGrid:PiApprove] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


