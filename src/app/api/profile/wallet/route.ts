import { supabaseAdmin }     from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const piUid = req.headers.get('x-pi-uid')
    if (!piUid) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'MISSING_WALLET_ADDRESS' },
        { status: 400 }
      )
    }

    // Validate Stellar wallet address format
    // Must start with G and be exactly 56 characters
    if (!walletAddress.startsWith('G') || walletAddress.length !== 56) {
      return NextResponse.json(
        { error: 'Invalid wallet address. Must start with G and be 56 characters.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('User')
      .update({
        walletAddress,
        updatedAt: new Date().toISOString(),
      })
      .eq('piUid', piUid)

    if (error) {
      console.error('[Nexus:Profile] Wallet update failed:', error)
      return NextResponse.json(
        { error: 'Failed to update wallet address' },
        { status: 500 }
      )
    }

    console.log('[Nexus:Profile] Wallet updated for:', piUid)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[Nexus:Profile] Error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
