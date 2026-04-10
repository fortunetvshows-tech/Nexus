import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Get user from x-pi-uid header
    const piUid = request.headers.get('x-pi-uid')

    if (!piUid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user ID from piUid
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('piUid', piUid)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const limitParam = searchParams.get('limit') || '10'
    const limit = Math.min(Math.max(parseInt(limitParam, 10), 1), 100) // Clamp between 1-100

    // 2. Query Transaction table with joins for Task and employer User
    let query = supabaseAdmin
      .from('Transaction')
      .select(`
        id,
        amount,
        netAmount,
        type,
        confirmedAt,
        txid,
        task:taskId (
          title,
          employer:employerId (
            piUsername
          )
        )
      `)
      .eq('receiverId', user.id)
      .eq('status', 'confirmed')
      .order('confirmedAt', { ascending: false })
      .limit(limit)

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('[GET /api/transactions] Error:', error)
      return NextResponse.json(
        { error: 'FETCH_FAILED' },
        { status: 500 }
      )
    }

    // Format response
    const formattedTransactions = (transactions ?? []).map((t: any) => ({
      id: t.id,
      amount: t.amount,
      netAmount: t.netAmount,
      type: t.type,
      taskTitle: t.task?.title || null,
      employerUsername: t.task?.employer?.piUsername || null,
      confirmedAt: t.confirmedAt,
      txid: t.txid
    }))

    return NextResponse.json({
      transactions: formattedTransactions
    })

  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
