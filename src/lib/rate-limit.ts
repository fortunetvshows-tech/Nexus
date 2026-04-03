import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiting for ProofGrid API endpoints.
 * Uses Upstash Redis sliding window algorithm.
 * Fails OPEN if Redis is not configured —
 * allows request through with a warning log.
 * This ensures local development works without Upstash.
 */

const isConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = isConfigured ? Redis.fromEnv() : null

if (!isConfigured) {
  console.warn(
    '[ProofGrid:RateLimit] Upstash Redis not configured. ' +
    'Rate limiting is DISABLED. ' +
    'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN ' +
    'to enable in production.'
  )
}

/**
 * Limiters keyed by endpoint sensitivity.
 * Window values are set by Lead Architect and must not be changed
 * without explicit authorization.
 *
 * submission:   10 requests / 1 minute per piUid
 * taskCreation:  5 requests / 1 minute per piUid
 * approval:      3 requests / 1 minute per piUid
 * auth:         20 requests / 1 minute per IP address
 */
export const limiters = {

  submission: isConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'nexus:rl:submission',
      })
    : null,

  taskCreation: isConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'nexus:rl:task',
      })
    : null,

  approval: isConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        analytics: true,
        prefix: 'nexus:rl:approval',
      })
    : null,

  auth: isConfigured
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: 'nexus:rl:auth',
      })
    : null,
}

export type LimiterKey = keyof typeof limiters

/**
 * Call this as the FIRST operation in every mutation endpoint.
 * Returns null if the request is allowed — proceed with handler.
 * Returns a NextResponse 429 if rate limit is exceeded — return it immediately.
 *
 * Usage:
 *   const limited = await checkRateLimit(req, 'submission')
 *   if (limited) return limited
 */
export async function checkRateLimit(
  req: NextRequest,
  limiterKey: LimiterKey
): Promise<NextResponse | null> {

  const limiter = limiters[limiterKey]

  // Fail open — not configured means local dev or misconfigured prod
  if (!limiter) {
    return null
  }

  // Auth endpoint is IP-based — all others are piUid-based
  // piUid comes from the Pi Network SDK header set at authentication
  const identifier =
    limiterKey === 'auth'
      ? (req.headers.get('x-forwarded-for') ??
         req.headers.get('x-real-ip') ??
         'anonymous-ip')
      : (req.headers.get('x-pi-uid') ??
         'anonymous-user')

  const { success, limit, remaining, reset } =
    await limiter.limit(identifier)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before trying again.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset':     reset.toString(),
          'Retry-After':           retryAfter.toString(),
        },
      }
    )
  }

  return null
}


