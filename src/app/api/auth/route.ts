import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Pi Platform API base URL
const PI_API_BASE = 'https://api.minepi.com'

interface PiMeResponse {
  uid: string
  username: string
  credentials: {
    scopes: string[]
    valid_until: {
      timestamp: number
      iso8601: string
    }
  }
}

interface AuthRequestBody {
  accessToken: string
  uid: string
}

export async function POST(req: NextRequest) {

  // Rate limit check — must be first
  const limited = await checkRateLimit(req, 'auth')
  if (limited) return limited

  // Parse request body
  let body: AuthRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'INVALID_REQUEST', message: 'Request body must be valid JSON' },
      { status: 400 }
    )
  }

  const { accessToken, uid } = body

  // Validate required fields
  if (!accessToken || !uid) {
    return NextResponse.json(
      {
        error: 'MISSING_CREDENTIALS',
        message: 'accessToken and uid are required',
      },
      { status: 400 }
    )
  }

  // Verify accessToken with Pi Platform /me API
  // This is the critical security step — client-provided values
  // are not trusted until Pi's servers confirm them
  let piUser: PiMeResponse
  try {
    const piResponse = await fetch(`${PI_API_BASE}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!piResponse.ok) {
      // Pi API rejected the token — do not create user
      return NextResponse.json(
        {
          error: 'INVALID_ACCESS_TOKEN',
          message: 'Could not verify identity with Pi Network',
        },
        { status: 401 }
      )
    }

    piUser = await piResponse.json()
  } catch {
    return NextResponse.json(
      {
        error: 'PI_API_UNREACHABLE',
        message: 'Could not reach Pi Network servers. Please try again.',
      },
      { status: 503 }
    )
  }

  // Cross-check: uid from client must match uid from Pi's servers
  // If they differ, this is a spoofing attempt
  if (piUser.uid !== uid) {
    // Log mismatch to AdminAction using a system record
    // We cannot use FraudSignal here — userId is NOT NULL
    // and we have no verified user to reference
    // Store full context in AdminAction metadata for fraud review
    await supabaseAdmin.from('AdminAction').insert({
      adminId: (await supabaseAdmin
        .from('User')
        .select('id')
        .eq('isAdmin', true)
        .limit(1)
        .single()
        .then(r => r.data?.id ?? '00000000-0000-0000-0000-000000000000')),
      actionType:  'uid_spoofing_attempt',
      targetType:  'auth',
      targetId:    '00000000-0000-0000-0000-000000000000',
      notes:       'Client uid did not match Pi server uid during authentication',
      metadata: {
        clientUid:   uid,
        serverUid:   piUser.uid,
        timestamp:   new Date().toISOString(),
        ipAddress:   req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json(
      {
        error:   'IDENTITY_MISMATCH',
        message: 'Identity verification failed',
      },
      { status: 401 }
    )
  }

  // Check if user is already banned BEFORE upserting
  // Banned users must not update their lastLoginAt or any other field
  const { data: existingUser } = await supabaseAdmin
    .from('User')
    .select('id, accountStatus')
    .eq('piUid', piUser.uid)
    .single()

  if (existingUser?.accountStatus === 'banned') {
    return NextResponse.json(
      {
        error:   'ACCOUNT_BANNED',
        message: 'This account has been suspended',
      },
      { status: 403 }
    )
  }

  // Upsert User record — create if new, update lastLoginAt if existing
  // Uses piUid as the immutable identity anchor
  // Only runs after confirming user is not banned
  const { data: user, error: upsertError } = await supabaseAdmin
    .from('User')
    .upsert(
      {
        piUid:       piUser.uid,
        piUsername:  piUser.username,
        lastLoginAt: new Date().toISOString(),
      },
      {
        onConflict:        'piUid',
        ignoreDuplicates:  false,
      }
    )
    .select('id, piUid, piUsername, userRole, reputationScore, reputationLevel, kycLevel, accountStatus')
    .single()

  if (upsertError) {
    return NextResponse.json(
      {
        error: 'DATABASE_ERROR',
        message: 'Failed to create user session',
      },
      { status: 500 }
    )
  }

  // Return verified user data — safe to use in client
  return NextResponse.json(
    {
      success: true,
      user: {
        id:               user.id,
        piUid:            user.piUid,
        piUsername:       user.piUsername,
        userRole:         user.userRole,
        reputationScore:  user.reputationScore,
        reputationLevel:  user.reputationLevel,
        kycLevel:         user.kycLevel,
      },
    },
    { status: 200 }
  )
}
