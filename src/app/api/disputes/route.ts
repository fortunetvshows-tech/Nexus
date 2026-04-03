import { checkRateLimit }  from '@/lib/rate-limit'
import { supabaseAdmin }   from '@/lib/supabase-admin'
import { fileDispute }     from '@/lib/services/dispute-service'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/disputes — file a dispute
export async function POST(req: NextRequest) {
  try {
    const limited = await checkRateLimit(req, 'submission')
    if (limited) return limited

    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { data: worker } = await supabaseAdmin
      .from('User')
      .select('id, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!worker || worker.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    let body: { submissionId?: string; reason?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const { submissionId, reason } = body

    if (!submissionId || !reason) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS' },
        { status: 400 }
      )
    }

    const result = await fileDispute(
      submissionId,
      worker.id,
      reason
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.code, message: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success:    true,
        disputeId:  result.disputeId,
        resolution: result.resolution,
        checks:     result.checks,
      },
      { status: 201 }
    )

  } catch (err) {
    console.error('[ProofGrid:DisputeRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// GET /api/disputes?submissionId=... or ?taskId=... — get disputes
export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const url          = new URL(req.url)
    const submissionId = url.searchParams.get('submissionId')
    const taskId       = url.searchParams.get('taskId')

    if (!submissionId && !taskId) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS' },
        { status: 400 }
      )
    }

    // If taskId provided, fetch disputes by taskId (join via Submission)
    if (taskId) {
      const { data: taskSubmissions } = await supabaseAdmin
        .from('Submission')
        .select('id')
        .eq('taskId', taskId)

      const submissionIds = (taskSubmissions ?? []).map(s => s.id)

      if (submissionIds.length === 0) {
        return NextResponse.json(
          { success: true, disputes: [] },
          { status: 200 }
        )
      }

      const { data: disputes } = await supabaseAdmin
        .from('Dispute')
        .select(`
          id, status, submissionId, raisedBy, createdAt
        `)
        .in('submissionId', submissionIds)
        .order('createdAt', { ascending: false })

      return NextResponse.json(
        { success: true, disputes: disputes ?? [] },
        { status: 200 }
      )
    }

    // Otherwise fetch by submissionId
    const { data: dispute, error } = await supabaseAdmin
      .from('Dispute')
      .select(`
        id, status, tier,
        workerReason, tier1Result,
        resolution, filedAt, tier1ResolvedAt
      `)
      .eq('submissionId', submissionId!)
      .order('filedAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, dispute },
      { status: 200 }
    )

  } catch (err) {
    console.error('[ProofGrid:DisputeRoute] GET error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}


