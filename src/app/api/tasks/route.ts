import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'taskCreation')
  if (limited) return limited

  // TODO: TB-003 will implement task creation business logic
  return NextResponse.json(
    { message: 'Tasks endpoint — coming soon' },
    { status: 200 }
  )
}
