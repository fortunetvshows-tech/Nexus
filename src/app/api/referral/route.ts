import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface ReferralRecord {
  id: string
  referredUserId: string
  status: string
  rewardAmount: number
  createdAt: string
  referredUser?: {
    piUsername: string
  }
}

interface ReferralStats {
  referralCode: string
  totalReferred: number
  qualifiedCount: number
  totalEarned: number
  referrals: Array<{
    id: string
    referredUsername: string
    status: string
    rewardAmount: number
    createdAt: string
  }>
}

export async function GET(req: NextRequest) {
  try {
    const uid = req.headers.get('x-pi-uid')
    if (!uid) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Missing authentication' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id, referralCode')
      .eq('piUid', uid)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Get referral records for this user (as referrer)
    const { data: referralsData, error: refError } = await supabaseAdmin
      .from('ReferralRecord')
      .select(
        'id, referredUserId, status, rewardAmount, createdAt, ' +
        'referredUser:referredUserId(piUsername)'
      )
      .eq('referrerId', user.id)
      .order('createdAt', { ascending: false })

    if (refError) {
      console.error('[Nexus:Referral] Failed to fetch referrals:', refError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to fetch referral data' },
        { status: 500 }
      )
    }

    const referrals = (referralsData || []) as unknown as ReferralRecord[]

    // Calculate stats
    const totalReferred = referrals.length
    const qualifiedCount = referrals.filter(r => r.status === 'qualified').length
    const totalEarned = referrals.reduce((sum, r) => sum + (Number(r.rewardAmount) || 0), 0)

    // Format referrals for response
    const formattedReferrals = referrals.map(r => ({
      id: r.id,
      referredUsername: (r as any).referredUser?.piUsername ?? 'Unknown',
      status: r.status,
      rewardAmount: Number(r.rewardAmount),
      createdAt: r.createdAt,
    }))

    const stats: ReferralStats = {
      referralCode: user.referralCode || 'NOT_SET',
      totalReferred,
      qualifiedCount,
      totalEarned: parseFloat(totalEarned.toFixed(4)),
      referrals: formattedReferrals,
    }

    return NextResponse.json({
      success: true,
      stats,
    }, { status: 200 })

  } catch (err) {
    console.error('[Nexus:ReferralRoute] Error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
