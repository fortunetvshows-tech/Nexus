import { supabaseAdmin } from '@/lib/supabase-admin'
import { castVote }      from '@/lib/services/arbitration-service'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/arbitration/vote — cast a vote as arbitrator
export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json()
    const { disputeId, vote, reasoning } = body as {
      disputeId: string
      vote:      'worker' | 'employer'
      reasoning: string
    }

    if (!disputeId || !vote || !reasoning) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      )
    }

    if (!['worker', 'employer'].includes(vote)) {
      return NextResponse.json(
        { error: 'INVALID_VOTE' },
        { status: 400 }
      )
    }

    const result = await castVote(
      disputeId,
      user.id,
      vote,
      reasoning
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success:      true,
        votesWorker:  result.votesWorker,
        votesEmployer: result.votesEmployer,
        resolved:     result.resolved,
      },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:ArbitrationVoteRoute] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

