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
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) return NextResponse.json(
      { error: 'UNAUTHORIZED' }, { status: 401 }
    )

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id, referralCode, piUsername')
      .eq('piUid', piUid)
      .single()

    if (userError) {
      console.error('[Nexus:Referral] User fetch error:', userError)
      return NextResponse.json(
        { error: userError.message }, { status: 500 }
      )
    }
    if (!user) return NextResponse.json(
      { error: 'NOT_FOUND' }, { status: 404 }
    )

    // Ensure referral code exists
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = 'NX-' + user.piUsername
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12)
      await supabaseAdmin
        .from('User')
        .update({ referralCode })
        .eq('id', user.id)
    }

    // Get users who were referred by this user
    const { data: referredUsers, error: refError } = await supabaseAdmin
      .from('User')
      .select('id, piUsername, createdAt')
      .eq('referredBy', user.id)

    if (refError) {
      console.error('[Nexus:Referral] Referred users error:', refError)
    }

    // Get referral records for reward tracking
    const { data: referralRecords, error: recordError } = await supabaseAdmin
      .from('ReferralRecord')
      .select('referredId, rewardPaid, qualifiedAt')
      .eq('referrerId', user.id)

    if (recordError) {
      console.error('[Nexus:Referral] Records error:', recordError)
    }

    // Build lookup map
    const recordMap: Record<string, {
      rewardPaid:  number
      qualifiedAt: string | null
    }> = {}

    for (const r of referralRecords ?? []) {
      recordMap[r.referredId] = {
        rewardPaid:  Number(r.rewardPaid ?? 0),
        qualifiedAt: r.qualifiedAt ?? null,
      }
    }

    // Build referrals list
    const referrals = (referredUsers ?? []).map(u => ({
      piUsername:  u.piUsername,
      qualifiedAt: recordMap[u.id]?.qualifiedAt ?? null,
      rewardPaid:  recordMap[u.id]?.rewardPaid  ?? 0,
    }))

    const totalEarned    = referrals.reduce(
      (sum, r) => sum + r.rewardPaid, 0
    )
    const qualifiedCount = referrals.filter(
      r => r.qualifiedAt !== null
    ).length

    return NextResponse.json({
      success: true,
      stats: {
        referralCode,
        totalReferred:  referrals.length,
        qualifiedCount,
        totalEarned,
        referrals,
      },
    })

  } catch (err: any) {
    console.error('[Nexus:Referral] Unhandled error:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
