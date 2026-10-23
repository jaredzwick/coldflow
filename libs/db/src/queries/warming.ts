import { and, eq, gte, inArray, lt, ne, notInArray, sql } from 'drizzle-orm'
import { db } from '../client'
import {
  emailAccount,
  warmingMessage,
  warmingSchedule,
  type InsertWarmingMessage,
  type InsertWarmingSchedule,
  type WarmingMessage,
  type WarmingSchedule,
} from '../schema'

export const getWarmingScheduleByAccountId = async (
  emailAccountId: string
): Promise<WarmingSchedule | null> => {
  const [row] = await db
    .select()
    .from(warmingSchedule)
    .where(eq(warmingSchedule.emailAccountId, emailAccountId))
    .limit(1)
  return row ?? null
}

export const upsertWarmingSchedule = async (
  data: InsertWarmingSchedule
): Promise<WarmingSchedule> => {
  const [row] = await db
    .insert(warmingSchedule)
    .values(data)
    .onConflictDoUpdate({
      target: warmingSchedule.emailAccountId,
      set: {
        status: data.status,
        startedAt: data.startedAt,
        dayNumber: data.dayNumber,
        targetVolumeToday: data.targetVolumeToday,
        sentToday: data.sentToday,
        volumeResetAt: data.volumeResetAt,
        maxDailyCap: data.maxDailyCap,
        rampDays: data.rampDays,
        updatedAt: new Date(),
      },
    })
    .returning()
  return row
}

/**
 * Flip a schedule's status. If turning on and no row exists yet, seed one with
 * day_number=0 and status='ramping' so the daily roll picks it up.
 */
export const setWarmingEnabled = async (
  emailAccountId: string,
  enabled: boolean
): Promise<WarmingSchedule> => {
  const existing = await getWarmingScheduleByAccountId(emailAccountId)

  if (!enabled) {
    if (!existing) {
      return upsertWarmingSchedule({
        id: `ws_${emailAccountId}`,
        emailAccountId,
        status: 'off',
      })
    }
    const [row] = await db
      .update(warmingSchedule)
      .set({ status: 'off', updatedAt: new Date() })
      .where(eq(warmingSchedule.emailAccountId, emailAccountId))
      .returning()
    return row
  }

  // enabling
  if (!existing) {
    return upsertWarmingSchedule({
      id: `ws_${emailAccountId}`,
      emailAccountId,
      status: 'ramping',
      startedAt: new Date(),
      dayNumber: 1,
      targetVolumeToday: 5,
      sentToday: 0,
    })
  }

  // Re-enabling within 24h preserves ramp progress; otherwise restart
  const stale =
    !existing.startedAt ||
    Date.now() - existing.startedAt.getTime() > 24 * 60 * 60 * 1000
  const [row] = await db
    .update(warmingSchedule)
    .set({
      status: existing.dayNumber >= existing.rampDays ? 'maintenance' : 'ramping',
      startedAt: stale ? new Date() : existing.startedAt,
      dayNumber: stale ? 1 : existing.dayNumber,
      targetVolumeToday: stale ? 5 : existing.targetVolumeToday,
      sentToday: stale ? 0 : existing.sentToday,
      updatedAt: new Date(),
    })
    .where(eq(warmingSchedule.emailAccountId, emailAccountId))
    .returning()
  return row
}

/**
 * Pick accounts eligible to send more warming emails right now.
 * Only returns schedules whose target_volume_today > sent_today.
 */
export const getAccountsDueToSend = async (
  limit = 50
): Promise<Array<WarmingSchedule & { email: string; userId: string }>> => {
  const rows = await db
    .select({
      id: warmingSchedule.id,
      emailAccountId: warmingSchedule.emailAccountId,
      status: warmingSchedule.status,
      startedAt: warmingSchedule.startedAt,
      dayNumber: warmingSchedule.dayNumber,
      targetVolumeToday: warmingSchedule.targetVolumeToday,
      sentToday: warmingSchedule.sentToday,
      volumeResetAt: warmingSchedule.volumeResetAt,
      inboxCount7d: warmingSchedule.inboxCount7d,
      spamCount7d: warmingSchedule.spamCount7d,
      replyCount7d: warmingSchedule.replyCount7d,
      maxDailyCap: warmingSchedule.maxDailyCap,
      rampDays: warmingSchedule.rampDays,
      createdAt: warmingSchedule.createdAt,
      updatedAt: warmingSchedule.updatedAt,
      email: emailAccount.email,
      userId: emailAccount.userId,
    })
    .from(warmingSchedule)
    .innerJoin(emailAccount, eq(emailAccount.id, warmingSchedule.emailAccountId))
    .where(
      and(
        inArray(warmingSchedule.status, ['ramping', 'maintenance']),
        eq(emailAccount.status, 'connected'),
        sql`${warmingSchedule.sentToday} < ${warmingSchedule.targetVolumeToday}`
      )
    )
    .limit(limit)
  return rows
}

/**
 * Pick a recipient from the warming pool for a given sender. Avoids any
 * recipient the sender has emailed in the last 24h. Prefers a different
 * user_id when any exist.
 */
export const pickWarmingRecipient = async (
  senderAccountId: string,
  senderUserId: string
): Promise<{ id: string; email: string; userId: string } | null> => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const recentRecipientRows = await db
    .select({ recipientAccountId: warmingMessage.recipientAccountId })
    .from(warmingMessage)
    .where(
      and(
        eq(warmingMessage.senderAccountId, senderAccountId),
        gte(warmingMessage.sentAt, dayAgo)
      )
    )
  const excluded = recentRecipientRows.map((r) => r.recipientAccountId)

  const baseFilters = [
    ne(emailAccount.id, senderAccountId),
    eq(emailAccount.status, 'connected'),
    inArray(warmingSchedule.status, ['ramping', 'maintenance']),
    ...(excluded.length ? [notInArray(emailAccount.id, excluded)] : []),
  ]

  // Prefer different user_id first
  const crossTenant = await db
    .select({
      id: emailAccount.id,
      email: emailAccount.email,
      userId: emailAccount.userId,
    })
    .from(emailAccount)
    .innerJoin(warmingSchedule, eq(warmingSchedule.emailAccountId, emailAccount.id))
    .where(and(...baseFilters, ne(emailAccount.userId, senderUserId)))
    .orderBy(sql`random()`)
    .limit(1)
  if (crossTenant[0]) return crossTenant[0]

  const sameTenant = await db
    .select({
      id: emailAccount.id,
      email: emailAccount.email,
      userId: emailAccount.userId,
    })
    .from(emailAccount)
    .innerJoin(warmingSchedule, eq(warmingSchedule.emailAccountId, emailAccount.id))
    .where(and(...baseFilters))
    .orderBy(sql`random()`)
    .limit(1)
  return sameTenant[0] ?? null
}

export const createWarmingMessage = async (
  data: InsertWarmingMessage
): Promise<WarmingMessage> => {
  const [row] = await db.insert(warmingMessage).values(data).returning()
  return row
}

/**
 * Compare-and-swap style increment. Returns true if the row was incremented
 * (sent_today was still < target_volume_today). Prevents double-send if the
 * cron fires twice.
 */
export const incrementSentTodayIfBelowTarget = async (
  warmingScheduleId: string
): Promise<boolean> => {
  const result = await db
    .update(warmingSchedule)
    .set({
      sentToday: sql`${warmingSchedule.sentToday} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(warmingSchedule.id, warmingScheduleId),
        sql`${warmingSchedule.sentToday} < ${warmingSchedule.targetVolumeToday}`
      )
    )
    .returning({ id: warmingSchedule.id })
  return result.length > 0
}

export const markWarmingMessageSent = async (
  warmingMessageId: string,
  gmailMessageId: string
): Promise<void> => {
  await db
    .update(warmingMessage)
    .set({
      status: 'sent',
      gmailMessageId,
      sentAt: new Date(),
    })
    .where(eq(warmingMessage.id, warmingMessageId))
}

export const markWarmingMessageFailed = async (
  warmingMessageId: string,
  errorMessage: string
): Promise<void> => {
  await db
    .update(warmingMessage)
    .set({ status: 'failed', errorMessage })
    .where(eq(warmingMessage.id, warmingMessageId))
}

/**
 * Daily roll. Advances day_number, resets sent_today, recomputes
 * target_volume_today from the ramp curve, flips to maintenance past
 * ramp_days.
 */
export const rollDailyWarmingSchedules = async (): Promise<{
  rolled: number
}> => {
  const schedules = await db
    .select()
    .from(warmingSchedule)
    .where(inArray(warmingSchedule.status, ['ramping', 'maintenance']))

  const now = new Date()

  for (const s of schedules) {
    const nextDay = s.dayNumber + 1
    const isRamping = nextDay < s.rampDays
    const nextStatus: 'ramping' | 'maintenance' = isRamping ? 'ramping' : 'maintenance'
    // Linear ramp: day 1 -> 5 emails; day rampDays -> maxDailyCap
    const nextTarget = isRamping
      ? Math.round(
          5 + ((s.maxDailyCap - 5) * (nextDay - 1)) / Math.max(1, s.rampDays - 1)
        )
      : s.maxDailyCap

    await db
      .update(warmingSchedule)
      .set({
        dayNumber: nextDay,
        targetVolumeToday: nextTarget,
        sentToday: 0,
        volumeResetAt: now,
        status: nextStatus,
        updatedAt: now,
      })
      .where(eq(warmingSchedule.id, s.id))
  }

  return { rolled: schedules.length }
}

export const countEligibleRecipients = async (
  senderAccountId: string
): Promise<number> => {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailAccount)
    .innerJoin(warmingSchedule, eq(warmingSchedule.emailAccountId, emailAccount.id))
    .where(
      and(
        ne(emailAccount.id, senderAccountId),
        eq(emailAccount.status, 'connected'),
        inArray(warmingSchedule.status, ['ramping', 'maintenance'])
      )
    )
  return Number(result[0]?.count ?? 0)
}
