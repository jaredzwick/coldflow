import { NextRequest, NextResponse } from 'next/server'
import { runWarmingSend } from '@/lib/warmingSender'

/**
 * POST /api/cron/warm-send
 *
 * Vercel cron endpoint. Scheduled every 15 minutes.
 * Protected by CRON_SECRET bearer header (same convention as process-queue).
 */

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json(
      { success: false, error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await runWarmingSend()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('warm-send cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    )
  }
}

// Vercel cron hits GET for GET-mode schedules. Support both.
export const GET = POST
