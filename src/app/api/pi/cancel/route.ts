import { NextRequest, NextResponse } from 'next/server'

const PI_API_KEY  = process.env.PI_API_KEY!
const PI_API_BASE = 'https://api.minepi.com'

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json()
    if (!paymentId) {
      return NextResponse.json({ error: 'MISSING_PAYMENT_ID' }, { status: 400 })
    }

    const res = await fetch(
      `${PI_API_BASE}/v2/payments/${paymentId}/cancel`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error('[ProofGrid:Cancel] Failed:', { paymentId, status: res.status, body })
      return NextResponse.json({ success: false, error: body }, { status: res.status })
    }

    const data = await res.json()
    console.log('[ProofGrid:Cancel] Payment cancelled:', paymentId)
    return NextResponse.json({ success: true, cancelled: data.status?.cancelled })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ProofGrid:Cancel] Error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}


