import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { PLATFORM_CONFIG } from '@/lib/config/platform'

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Fetch all worker_payout transactions for this user
    const { data: transactions, error } = await supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        type,
        amount,
        netAmount,
        platformFee,
        status,
        createdAt,
        task:taskId (
          id,
          title,
          category
        )
      `)
      .eq('receiverId', user.id)
      .eq('type', 'worker_payout')
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[Nexus:Analytics:Worker] Error:', error)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    const txList = transactions ?? []

    // Calculate summary stats
    const totalEarned = txList
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    const totalPending = txList
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    const confirmedCount = txList
      .filter(t => t.status === 'confirmed').length

    const pendingCount = txList
      .filter(t => t.status === 'pending').length

    // This week earnings
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeekEarned = txList
      .filter(t =>
        t.status === 'confirmed' &&
        new Date(t.createdAt) > oneWeekAgo
      )
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalEarned,
          totalPending,
          thisWeekEarned,
          confirmedCount,
          pendingCount,
          platformFeeRate: PLATFORM_CONFIG.PLATFORM_FEE_RATE,
          networkFee:      PLATFORM_CONFIG.NETWORK_FEE_PI,
        },
        transactions: txList,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:Analytics:Worker] Unhandled:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
