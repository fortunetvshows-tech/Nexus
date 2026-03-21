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
        piUsername,
        piUid,
        walletAddress,
        reputationScore,
        reputationLevel,
        kycLevel,
        totalEarnings,
        totalTasksCompleted,
        createdAt
      `)
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile: user })

  } catch (err) {
    console.error('[Nexus:Profile] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
