'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-pi-uid',
}

interface StuckPayment {
  id: string
  piPaymentId: string
  amount: number
  netAmount: number
  platformFee: number
  status: string
  createdAt: string
  receiverId: string
  worker: {
    id: string
    piUsername: string
    piUid: string
    walletAddress: string
  } | null
  task: {
    id: string
    title: string
  } | null
  submission: {
    id: string
    status: string
  } | null
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders })

    const { data: admin } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders })
    }

    // Get transactions that are pending and created more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: stuckPayments, error } = await supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        piPaymentId,
        amount,
        netAmount,
        platformFee,
        status,
        createdAt,
        receiverId,
        taskId,
        submissionId,
        user:receiverId (
          id,
          piUsername,
          piUid,
          walletAddress
        ),
        task:taskId (
          id,
          title
        ),
        submission:submissionId (
          id,
          status
        )
      `)
      .eq('type', 'worker_payout')
      .eq('status', 'pending')
      .lt('createdAt', oneHourAgo)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[Nexus:StuckPayments] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stuck payments', detail: error.message },
        { status: 500, headers: corsHeaders }
      )
    }

    // Format response
    const formatted = (stuckPayments || []).map((tx: any) => ({
      id: tx.id,
      piPaymentId: tx.piPaymentId,
      amount: tx.amount,
      netAmount: tx.netAmount,
      platformFee: tx.platformFee,
      status: tx.status,
      createdAt: tx.createdAt,
      receiverId: tx.receiverId,
      worker: tx.user
        ? {
            id: tx.user.id,
            piUsername: tx.user.piUsername,
            piUid: tx.user.piUid,
            walletAddress: tx.user.walletAddress,
          }
        : null,
      task: tx.task,
      submission: tx.submission,
    }))

    return NextResponse.json(
      {
        success: true,
        count: formatted.length,
        payments: formatted,
      },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[Nexus:StuckPayments] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401, headers: corsHeaders })

    const { data: admin } = await supabaseAdmin
      .from('User')
      .select('id, isAdmin')
      .eq('piUid', piUid)
      .single()

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403, headers: corsHeaders })
    }

    const { action, paymentIds } = await req.json()

    if (!action || !paymentIds || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing action or paymentIds' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (action === 'clear_stuck') {
      // Mark payments as cancelled
      const { error: updateError } = await supabaseAdmin
        .from('Transaction')
        .update({
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        })
        .in('id', paymentIds)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to clear payments', detail: updateError.message },
          { status: 500, headers: corsHeaders }
        )
      }

      console.log('[Nexus:Admin] Cleared stuck payments:', {
        count: paymentIds.length,
        paymentIds,
        admin: piUid,
      })

      return NextResponse.json(
        {
          success: true,
          message: `Cleared ${paymentIds.length} stuck payment(s)`,
          clearedCount: paymentIds.length,
        },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders })
  } catch (err: any) {
    console.error('[Nexus:StuckPayments:POST] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500, headers: corsHeaders })
  }
}
