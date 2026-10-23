import { NextRequest, NextResponse } from 'next/server'
import { rollDailyWarmingSchedules } from '@coldflow/db'

/**
 * POST /api/cron/warm-roll
 *
 * Vercel cron endpoint. Scheduled daily at 00:00 UTC.
 * Advances day_number, resets sent_today, recomputes target_volume_today.
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
    const result = await rollDailyWarmingSchedules()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('warm-roll cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    )
  }
}

export const GET = POST
