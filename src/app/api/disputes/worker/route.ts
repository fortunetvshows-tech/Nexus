import { supabaseAdmin }         from '@/lib/supabase-admin'
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

    const { data: disputes } = await supabaseAdmin
      .from('Dispute')
      .select(`
        id,
        status,
        tier1Result,
        tier2VotesFor,
        tier2VotesAgainst,
        resolvedInFavor,
        createdAt,
        updatedAt,
        submission:submissionId (
          id,
          status,
          task:taskId (
            id,
            title,
            category
          )
        )
      `)
      .eq('raisedBy', user.id)
      .order('createdAt', { ascending: false })
      .limit(10)

    return NextResponse.json({ success: true, disputes: disputes ?? [] })

  } catch (err) {
    console.error('[ProofGrid:DisputeWorker] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

