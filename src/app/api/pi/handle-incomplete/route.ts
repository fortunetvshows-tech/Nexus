import { NextRequest, NextResponse } from 'next/server'

const PI_API_KEY  = process.env.PI_API_KEY!
const PI_API_BASE = 'https://api.minepi.com'

export async function POST(req: NextRequest) {
  try {
    const { payment } = await req.json()

    if (!payment?.identifier) {
      return NextResponse.json({ error: 'MISSING_PAYMENT' }, { status: 400 })
    }

    const paymentId  = payment.identifier
    const direction  = payment.direction  // 'user_to_app' or 'app_to_user'
    const txid       = payment.transaction?.txid ?? null
    const isVerified = payment.transaction?.verified ?? false

    console.log('[Nexus:Incomplete] Handling incomplete payment:', {
      paymentId,
      direction,
      txid,
      status: payment.status,
    })

    // U2A payment — user paid but we never completed it
    if (direction === 'user_to_app') {
      if (txid && isVerified) {
        // Transaction exists on blockchain — complete it
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
        const data = await res.json()
        console.log('[Nexus:Incomplete] U2A completed:', data)
        return NextResponse.json({ success: true, action: 'completed', paymentId })
      } else {
        // No transaction yet — cancel it
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
        const data = await res.json()
        console.log('[Nexus:Incomplete] U2A cancelled:', data)
        return NextResponse.json({ success: true, action: 'cancelled', paymentId })
      }
    }

    // A2U payment — platform sent but never completed
    if (direction === 'app_to_user') {
      if (txid) {
        // Complete it
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
        const data = await res.json()
        console.log('[Nexus:Incomplete] A2U completed:', data)
        return NextResponse.json({ success: true, action: 'completed', paymentId })
      } else {
        // Cancel it
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
        const data = await res.json()
        console.log('[Nexus:Incomplete] A2U cancelled:', data)
        return NextResponse.json({ success: true, action: 'cancelled', paymentId })
      }
    }

    return NextResponse.json({ success: true, action: 'no_action', paymentId })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Nexus:Incomplete] Error:', message)
    return NextResponse.json({ success: false, error: message })
  }
}
