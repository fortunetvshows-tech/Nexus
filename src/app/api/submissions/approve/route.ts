import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'approval')
  if (limited) return limited

  // TODO: TB-004 will wire approveSubmission() from escrow-service
  // Do NOT call Supabase directly in this route — ever
  return NextResponse.json(
    { message: 'Approval endpoint — coming soon' },
    { status: 200 }
  )
}
