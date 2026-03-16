import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req:     NextRequest,
  context: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await context.params
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

    // Verify user is an assigned arbitrator
    const { data: assignment } = await supabaseAdmin
      .from('PeerArbitration')
      .select('id')
      .eq('disputeId', disputeId)
      .eq('arbitratorId', user.id)
      .is('vote', null)
      .maybeSingle()

    if (!assignment) {
      return NextResponse.json(
        { error: 'NOT_ASSIGNED' },
        { status: 403 }
      )
    }

    // Fetch dispute
    const { data: dispute } = await supabaseAdmin
      .from('Dispute')
      .select('id, status, tier1Result, submissionId, taskId')
      .eq('id', disputeId)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Fetch submission (proof only — no worker identity to prevent bias)
    const { data: submission } = await supabaseAdmin
      .from('Submission')
      .select('proofContent, proofFileUrl, rejectionReason, submissionType')
      .eq('id', dispute.submissionId)
      .single()

    // Fetch task instructions (no employer identity)
    const { data: task } = await supabaseAdmin
      .from('Task')
      .select('title, description, instructions, category, proofType')
      .eq('id', dispute.taskId)
      .single()

    return NextResponse.json(
      { success: true, dispute, submission, task },
      { status: 200 }
    )

  } catch (err) {
    console.error('[Nexus:ArbitrateDisputeRoute] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
