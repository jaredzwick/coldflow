import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthorizationError } from '@/lib/authorization';
import {
  getEmailAccountsByUserId,
  getWarmingScheduleByAccountId,
} from '@coldflow/db';

/**
 * GET /api/email-accounts
 *
 * List all connected email accounts for the authenticated user.
 * Optionally filter by subAgencyId.
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Get optional subAgencyId from query params
    const searchParams = request.nextUrl.searchParams;
    const subAgencyId = searchParams.get('subAgencyId');

    // Fetch email accounts (tokens are excluded by the query function for security)
    const accounts = await getEmailAccountsByUserId(
      user.id,
      subAgencyId || undefined
    );

    const warmingByAccount = await Promise.all(
      accounts.map((a) => getWarmingScheduleByAccountId(a.id))
    );

    return NextResponse.json({
      success: true,
      accounts: accounts.map((account, idx) => {
        const warming = warmingByAccount[idx];
        return {
          id: account.id,
          email: account.email,
          provider: account.provider,
          status: account.status,
          dailyQuota: account.dailyQuota,
          quotaUsedToday: account.quotaUsedToday,
          quotaResetAt: account.quotaResetAt,
          lastSyncedAt: account.lastSyncedAt,
          errorMessage: account.errorMessage,
          createdAt: account.createdAt,
          warming: warming
            ? {
                status: warming.status,
                dayNumber: warming.dayNumber,
                rampDays: warming.rampDays,
                targetVolumeToday: warming.targetVolumeToday,
                sentToday: warming.sentToday,
                inboxCount7d: warming.inboxCount7d,
                spamCount7d: warming.spamCount7d,
                replyCount7d: warming.replyCount7d,
                maxDailyCap: warming.maxDailyCap,
              }
            : { status: 'off' as const },
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching email accounts:', error);

    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}
