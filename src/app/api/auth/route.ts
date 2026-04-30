import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Log environment variable status on cold start
// This appears in Vercel function logs and confirms
// which variables are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[ProofGrid:Auth] MISSING: NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ProofGrid:Auth] MISSING: SUPABASE_SERVICE_ROLE_KEY')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('[ProofGrid:Auth] MISSING: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

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
  accessToken:   string
  uid:           string
  walletAddress: string | null
  refCode?:      string
}

type UserRow = {
  id: string
  piUid: string
  piUsername: string
  userRole: string
  reputationScore: number
  reputationLevel: string
  kycLevel: number
  accountStatus: string
  isAdmin: boolean
}

export async function POST(req: NextRequest) {

  // Top-level error boundary — catches any unhandled exception
  // and returns structured error instead of raw 500
  let authStep = 'start'
  try {

    // Rate limit check — must be first
    authStep = 'rate_limit'
    try {
      const limited = await checkRateLimit(req, 'auth')
      if (limited) return limited
    } catch (rateLimitError) {
      // Fail-open on rate limiter transport/runtime errors
      console.error('[ProofGrid:Auth] Rate limiter failed open:', rateLimitError)
    }

    // Parse request body
    authStep = 'parse_body'
    let body: AuthRequestBody
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Request body must be valid JSON' },
        { status: 400 }
      )
    }

    const { accessToken, uid, walletAddress, refCode } = body

    if (!accessToken || !uid) {
      return NextResponse.json(
        {
          error: 'MISSING_CREDENTIALS',
          message: 'accessToken and uid are required',
        },
        { status: 400 }
      )
    }

    // Verify with Pi Platform /me API
    authStep = 'pi_verify'
    let piUser: PiMeResponse
    try {
      const piResponse = await fetch(`${PI_API_BASE}/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!piResponse.ok) {
        const errorBody = await piResponse.text()
        console.error('[ProofGrid:Auth] Pi /me API rejected token:', {
          status: piResponse.status,
          body: errorBody,
        })
        return NextResponse.json(
          {
            error: 'INVALID_ACCESS_TOKEN',
            message: 'Could not verify identity with Pi Network',
          },
          { status: 401 }
        )
      }

      piUser = await piResponse.json()
      console.log('[ProofGrid:Auth] Pi /me verified:', {
        uid: piUser.uid,
        username: piUser.username,
      })

    } catch (fetchError) {
      console.error('[ProofGrid:Auth] Pi API fetch failed:', fetchError)
      return NextResponse.json(
        {
          error: 'PI_API_UNREACHABLE',
          message: 'Could not reach Pi Network servers. Please try again.',
        },
        { status: 503 }
      )
    }

    // Cross-check uid
    if (piUser.uid !== uid) {
      console.warn('[ProofGrid:Auth] UID mismatch detected:', {
        clientUid: uid,
        serverUid: piUser.uid,
      })

      // Log to AdminAction — find any admin user for the adminId reference
      // If no admin exists yet, skip the log rather than crashing
      try {
        const { data: adminUser } = await supabaseAdmin
          .from('User')
          .select('id')
          .eq('isAdmin', true)
          .limit(1)
          .single()

        if (adminUser?.id) {
          await supabaseAdmin.from('AdminAction').insert({
            adminId:    adminUser.id,
            actionType: 'uid_spoofing_attempt',
            targetType: 'auth',
            targetId:   '00000000-0000-0000-0000-000000000000',
            notes:      'Client uid did not match Pi server uid',
            metadata: {
              clientUid:  uid,
              serverUid:  piUser.uid,
              timestamp:  new Date().toISOString(),
              ipAddress:  req.headers.get('x-forwarded-for') ?? 'unknown',
            },
          })
        }
      } catch (logError) {
        // Log failure must never crash the auth route
        console.error('[ProofGrid:Auth] Failed to log uid mismatch:', logError)
      }

      return NextResponse.json(
        {
          error:   'IDENTITY_MISMATCH',
          message: 'Identity verification failed',
        },
        { status: 401 }
      )
    }

    // Check ban status BEFORE upsert
    authStep = 'ban_check'
    try {
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
    } catch (banCheckError) {
      console.error('[ProofGrid:Auth] Ban check failed:', banCheckError)
      // Non-fatal — proceed to upsert
    }

    // Generate referral code for new users
    authStep = 'referral_code'
    const referralCode = 'NX-' + piUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

    // Build upsert object
    const upsertObject: any = {
      piUid:         piUser.uid,
      piUsername:    piUser.username,
      lastLoginAt:   new Date().toISOString(),
      walletAddress: walletAddress ?? null,
      referralCode:  referralCode,
    }

    // Check if refCode was provided and is valid
    authStep = 'referrer_lookup'
    if (refCode && refCode.startsWith('NX-')) {
      try {
        // Find the referrer
        const { data: referrer } = await supabaseAdmin
          .from('User')
          .select('id, piUid, piUsername')
          .eq('referralCode', refCode)
          .neq('piUid', piUser.uid) // Prevent self-referral
          .single()

        // If valid referrer found, set referredBy
        if (referrer) {
          upsertObject.referredBy = referrer.piUid
        }
      } catch (refError) {
        // Invalid refCode — proceed with upsert anyway (non-blocking)
        console.error('[ProofGrid:Auth] Invalid referral code:', { refCode, error: refError })
      }
    }

    // Upsert user record with explicit type assertion
    authStep = 'user_upsert'
    let upsertResult: any
    try {
      upsertResult = await supabaseAdmin
        .from('User')
        .upsert(upsertObject, {
          onConflict:       'piUid',
          ignoreDuplicates: false,
        })
        .select(
          'id, piUid, piUsername, userRole, reputationScore, ' +
          'reputationLevel, kycLevel, accountStatus, isAdmin'
        )
        .single()
    } catch (upsertThrownError) {
      console.error('[ProofGrid:Auth] Upsert threw unexpectedly:', upsertThrownError)
      return NextResponse.json(
        {
          error:   'DATABASE_ERROR',
          message: 'User profile setup failed. Please retry.',
        },
        { status: 500 }
      )
    }

    const { data: user, error: upsertError } = upsertResult as {
      data: UserRow | null
      error: any
    }

    if (upsertError || !user) {
      console.error('[ProofGrid:Auth] User upsert failed:', {
        code:    upsertError?.code || 'UNKNOWN',
        message: upsertError?.message || 'No data returned',
        details: upsertError?.details,
      })
      return NextResponse.json(
        {
          error:   'DATABASE_ERROR',
          message: 'Failed to create user session',
        },
        { status: 500 }
      )
    }

    console.log('[ProofGrid:Auth] Authentication successful:', {
      id:       user.id,
      piUid:    user.piUid,
      username: user.piUsername,
      role:     user.userRole,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id:              user.id,
          piUid:           user.piUid,
          piUsername:      user.piUsername,
          userRole:        user.userRole,
          reputationScore: user.reputationScore,
          reputationLevel: user.reputationLevel,
          kycLevel:        user.kycLevel,
          isAdmin:         user.isAdmin === true,
        },
      },
      { status: 200 }
    )

  } catch (unhandledError) {
    // This catches anything that escaped the inner try/catch blocks
    // Log the full error for diagnosis
    console.error('[ProofGrid:Auth] UNHANDLED ERROR:', { step: authStep, error: unhandledError })
    return NextResponse.json(
      {
        error:   'INTERNAL_ERROR',
        message: `Authentication failed at step: ${authStep}. Please try again.`,
      },
      { status: 500 }
    )
  }
}


