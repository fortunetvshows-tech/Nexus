import { supabaseAdmin }         from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!user?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

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
        raisedBy,
        againstUser,
        worker:raisedBy (
          id,
          piUsername,
          reputationLevel
        ),
        employer:againstUser (
          id,
          piUsername
        ),
        submission:submissionId (
          id,
          status,
          rejectionReason,
          task:taskId (
            id,
            title,
            category
          )
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(50)

    return NextResponse.json({ success: true, disputes: disputes ?? [] })

  } catch (err) {
    console.error('[Nexus:AdminDisputes] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!user?.isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { disputeId, resolution } = await req.json()

    if (!disputeId || !['resolved_worker', 'resolved_employer'].includes(resolution)) {
      return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 })
    }

    // Fetch dispute to get IDs
    const { data: dispute } = await supabaseAdmin
      .from('Dispute')
      .select('id, raisedBy, againstUser, submissionId, status')
      .eq('id', disputeId)
      .single()

    if (!dispute) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const resolvedInFavor = resolution === 'resolved_worker'
      ? dispute.raisedBy
      : dispute.againstUser

    // Resolve dispute
    await supabaseAdmin
      .from('Dispute')
      .update({
        status:           resolution,
        resolvedInFavor,
        tier2VotesFor:    resolution === 'resolved_worker' ? 3 : 0,
        tier2VotesAgainst: resolution === 'resolved_employer' ? 3 : 0,
        resolvedAt:       new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      })
      .eq('id', disputeId)

    // If worker wins — re-queue submission and re-reserve slot
    if (resolution === 'resolved_worker' && dispute.submissionId) {
      // Re-queue submission
      await supabaseAdmin
        .from('Submission')
        .update({ status: 'SUBMITTED', updatedAt: new Date().toISOString() })
        .eq('id', dispute.submissionId)

      // Get taskId and workerId for this submission
      const { data: sub } = await supabaseAdmin
        .from('Submission')
        .select('taskId, workerId')
        .eq('id', dispute.submissionId)
        .single()

      if (sub) {
        // Decrement slotsRemaining to re-reserve the slot
        await supabaseAdmin.rpc('reserve_task_slot', {
          p_task_id:   sub.taskId,
          p_worker_id: sub.workerId,
        })
      }
    }

    // Notify worker
    await supabaseAdmin
      .from('Notification')
      .insert({
        userId: dispute.raisedBy,
        type:   'dispute_resolved',
        title:  resolution === 'resolved_worker'
          ? 'Dispute resolved in your favor'
          : 'Dispute resolved — employer upheld',
        body: resolution === 'resolved_worker'
          ? 'Admin reviewed your case and ruled in your favor. Your submission has been re-queued.'
          : 'Admin reviewed your case and upheld the employer\'s decision.',
        metadata: { disputeId, resolution, resolvedBy: 'admin' },
      })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Nexus:AdminDisputes:Resolve] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
