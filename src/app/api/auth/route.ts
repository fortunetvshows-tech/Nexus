import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

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

  // Top-level error boundary — catches any unhandled exception
  // and returns structured error instead of raw 500
  try {

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
    let piUser: PiMeResponse
    try {
      const piResponse = await fetch(`${PI_API_BASE}/v2/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!piResponse.ok) {
        const errorBody = await piResponse.text()
        console.error('[Nexus:Auth] Pi /me API rejected token:', {
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
      console.log('[Nexus:Auth] Pi /me verified:', {
        uid: piUser.uid,
        username: piUser.username,
      })

    } catch (fetchError) {
      console.error('[Nexus:Auth] Pi API fetch failed:', fetchError)
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
      console.warn('[Nexus:Auth] UID mismatch detected:', {
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
        console.error('[Nexus:Auth] Failed to log uid mismatch:', logError)
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
      console.error('[Nexus:Auth] Ban check failed:', banCheckError)
      // Non-fatal — proceed to upsert
    }

    // Upsert user record
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('User')
      .upsert(
        {
          piUid:       piUser.uid,
          piUsername:  piUser.username,
          lastLoginAt: new Date().toISOString(),
        },
        {
          onConflict:       'piUid',
          ignoreDuplicates: false,
        }
      )
      .select(
        'id, piUid, piUsername, userRole, reputationScore, ' +
        'reputationLevel, kycLevel, accountStatus'
      )
      .single()

    if (upsertError) {
      console.error('[Nexus:Auth] User upsert failed:', {
        code:    upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
      })
      return NextResponse.json(
        {
          error:   'DATABASE_ERROR',
          message: 'Failed to create user session',
        },
        { status: 500 }
      )
    }

    console.log('[Nexus:Auth] Authentication successful:', {
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
        },
      },
      { status: 200 }
    )

  } catch (unhandledError) {
    // This catches anything that escaped the inner try/catch blocks
    // Log the full error for diagnosis
    console.error('[Nexus:Auth] UNHANDLED ERROR:', unhandledError)
    return NextResponse.json(
      {
        error:   'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
