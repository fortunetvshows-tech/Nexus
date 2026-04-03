import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

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
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Platform-wide transaction summary
    const { data: txSummary } = await supabaseAdmin
      .from('Transaction')
      .select('type, status, amount, netAmount, platformFee, createdAt')
      .order('createdAt', { ascending: false })
      .limit(100)

    const { data: userStats } = await supabaseAdmin
      .from('User')
      .select('id, piUsername, reputationScore, reputationLevel, createdAt')
      .order('reputationScore', { ascending: false })
      .limit(20)

    const { data: taskStats } = await supabaseAdmin
      .from('Task')
      .select('id, title, taskStatus, piReward, slotsAvailable, slotsRemaining, createdAt')
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })

    const txList   = txSummary ?? []
    const userList = userStats ?? []
    const taskList = taskStats ?? []

    // Calculate platform metrics
    const totalPiEscrowed = txList
      .filter(t => t.type === 'escrow_in' && t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalPiPaidOut = txList
      .filter(t => t.type === 'worker_payout' && t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    const totalPlatformRevenue = txList
      .filter(t => t.type === 'platform_fee')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalPiPending = txList
      .filter(t => t.type === 'worker_payout' && t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.netAmount), 0)

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalUsers:           userList.length,
          totalTasks:           taskList.length,
          activeTasks:          taskList.filter(
            t => t.taskStatus === 'escrowed'
          ).length,
          totalPiEscrowed,
          totalPiPaidOut,
          totalPlatformRevenue,
          totalPiPending,
          totalTransactions:    txList.length,
        },
        recentTransactions: txList.slice(0, 20),
        topUsers:           userList,
        tasks:              taskList,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:Analytics:Admin] Unhandled:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


