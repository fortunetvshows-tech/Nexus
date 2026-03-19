import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const PI_API_KEY  = process.env.PI_API_KEY!
const PI_API_BASE = 'https://api.minepi.com'

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('User').select('id, isAdmin').eq('piUid', piUid).single()
    if (!admin?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { paymentId, transactionId } = await req.json()
    if (!paymentId) return NextResponse.json({ error: 'MISSING_PAYMENT_ID' }, { status: 400 })

    // Cancel on Pi Network
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
      return NextResponse.json({
        success: false,
        error:   `Pi cancel failed: ${res.status} — ${body}`,
      })
    }

    // Mark transaction as failed in our DB
    if (transactionId) {
      await supabaseAdmin
        .from('Transaction')
        .update({
          status:    'failed',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .eq('status', 'pending')
    }

    const data = await res.json()
    return NextResponse.json({ success: true, cancelled: data.status?.cancelled })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Nexus:CancelPayment] Error:', message)
    return NextResponse.json({ success: false, error: message })
  }
}
