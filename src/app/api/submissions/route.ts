import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'submission')
  if (limited) return limited

  // TODO: TB-002 will implement submission business logic
  return NextResponse.json(
    { message: 'Submissions endpoint — coming soon' },
    { status: 200 }
  )
}
