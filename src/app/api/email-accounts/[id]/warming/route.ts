import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthorizationError } from '@/lib/authorization'
import { getEmailAccountById, setWarmingEnabled } from '@coldflow/db'

/**
 * POST /api/email-accounts/[id]/warming
 *
 * Toggle warming on/off for a connected email account.
 * Body: { enabled: boolean }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const account = await getEmailAccountById(id)
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Email account not found' },
        { status: 404 }
      )
    }
    if (account.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    let body: { enabled?: boolean } = {}
    try {
      body = (await request.json()) as { enabled?: boolean }
    } catch {
      // treat as missing
    }

    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Body must include { enabled: boolean }' },
        { status: 400 }
      )
    }

    const schedule = await setWarmingEnabled(id, body.enabled)
    return NextResponse.json({ success: true, schedule })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('warming toggle error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle warming' },
      { status: 500 }
    )
  }
}
