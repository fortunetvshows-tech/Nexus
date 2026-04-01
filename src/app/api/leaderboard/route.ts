import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    // Get start of current week (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)

    // Top 10 workers by confirmed earnings this week
    const { data: topWorkers } = await supabaseAdmin
      .from('Transaction')
      .select(`
        receiverId,
        netAmount,
        receiver:receiverId (
          id,
          piUsername,
          reputationLevel,
          reputationScore
        )
      `)
      .eq('status', 'confirmed')
      .eq('type', 'worker_payout')
      .gte('createdAt', weekStart.toISOString())
      .not('receiverId', 'is', null)

    // Aggregate by worker
    const workerMap: Record<string, {
      id: string
      piUsername: string
      reputationLevel: string
      reputationScore: number
      weeklyEarned: number
    }> = {}

    for (const tx of topWorkers ?? []) {
      const receiver = tx.receiver as any
      if (!receiver?.id) continue
      if (!workerMap[receiver.id]) {
        workerMap[receiver.id] = {
          id:              receiver.id,
          piUsername:      receiver.piUsername,
          reputationLevel: receiver.reputationLevel ?? 'Newcomer',
          reputationScore: receiver.reputationScore ?? 0,
          weeklyEarned:    0,
        }
      }
      workerMap[receiver.id].weeklyEarned += Number(tx.netAmount)
    }

    // Sort and take top 10
    const leaderboard = Object.values(workerMap)
      .sort((a, b) => b.weeklyEarned - a.weeklyEarned)
      .slice(0, 10)
      .map((w, i) => ({ ...w, rank: i + 1 }))

    // Find current user rank
    const allWorkers = Object.values(workerMap)
      .sort((a, b) => b.weeklyEarned - a.weeklyEarned)
    const userRank = allWorkers.findIndex(w => w.id === user.id) + 1
    const userEntry = allWorkers.find(w => w.id === user.id)

    return NextResponse.json({
      success:     true,
      leaderboard,
      userRank:    userRank > 0 ? userRank : null,
      userEarned:  userEntry?.weeklyEarned ?? 0,
      weekStart:   weekStart.toISOString(),
    })

  } catch (err) {
    console.error('[ProofGrid:Leaderboard] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

