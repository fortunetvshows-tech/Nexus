import { checkRateLimit }      from '@/lib/rate-limit'
import { supabaseAdmin }        from '@/lib/supabase-admin'
import { rejectSubmission }     from '@/lib/services/escrow-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest
) {
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

    const { data: employer } = await supabaseAdmin
      .from('User')
      .select('id, accountStatus')
      .eq('piUid', piUid)
      .single()

    if (!employer || employer.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { submissionId, rejectReason } = body

    if (!submissionId) {
      return NextResponse.json(
        { error: 'MISSING_SUBMISSION_ID' },
        { status: 400 }
      )
    }

    // Verify employer owns this submission
    const { data: submission } = await supabaseAdmin
      .from('Submission')
      .select('id, workerId, taskId, status')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Verify task belongs to employer
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('employerId')
      .eq('id', submission.taskId)
      .single()

    if (!task || task.employerId !== employer.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const result = await rejectSubmission(
      submissionId,
      employer.id,
      rejectReason || 'Quality below threshold'
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:RejectRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
