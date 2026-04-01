import { supabaseAdmin }     from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select(`
        id,
        piUsername,
        piUid,
        walletAddress,
        reputationScore,
        reputationLevel,
        kycLevel,
        totalTasksCompleted,
        createdAt
      `)
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Calculate real-time earnings from confirmed worker_payout transactions
    const { data: transactions } = await supabaseAdmin
      .from('Transaction')
      .select('netAmount, status')
      .eq('receiverId', user.id)
      .eq('type', 'worker_payout')

    const transactions_list = transactions ?? []
    const totalEarnings = transactions_list
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        totalEarnings,
      },
    })

  } catch (err) {
    console.error('[ProofGrid:Profile] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

