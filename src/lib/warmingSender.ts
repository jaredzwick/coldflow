import { nanoid } from 'nanoid'
import {
  countEligibleRecipients,
  createWarmingMessage,
  getAccountsDueToSend,
  incrementSentTodayIfBelowTarget,
  markWarmingMessageFailed,
  markWarmingMessageSent,
  pickWarmingRecipient,
} from '@coldflow/db'
import { sendEmail } from './gmailService'
import { pickRandomWarmingTemplate } from './warmingTemplates'

/**
 * Warming send loop. Called by /api/cron/warm-send.
 *
 * For each account due to send more warming emails today, pick ONE recipient
 * from the peer pool and send ONE message. The compare-and-swap on
 * `sent_today` prevents double-sending when the cron fires twice.
 *
 * The loop sends a bounded number per invocation (default 5 per account per
 * run) so volume naturally spreads across the day instead of firing the full
 * daily target in one burst.
 */

export interface WarmingSendResult {
  attempted: number
  sent: number
  skipped: number
  failed: number
  waitingForPool: number
  details: Array<{
    senderEmail: string
    recipientEmail?: string
    status: 'sent' | 'failed' | 'skipped' | 'waiting_for_pool'
    error?: string
  }>
}

const MAX_SENDS_PER_ACCOUNT_PER_RUN = 5

export async function runWarmingSend(): Promise<WarmingSendResult> {
  const result: WarmingSendResult = {
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    waitingForPool: 0,
    details: [],
  }

  const dueSchedules = await getAccountsDueToSend(50)

  for (const schedule of dueSchedules) {
    const remaining = Math.min(
      MAX_SENDS_PER_ACCOUNT_PER_RUN,
      schedule.targetVolumeToday - schedule.sentToday
    )
    if (remaining <= 0) continue

    const eligibleCount = await countEligibleRecipients(schedule.emailAccountId)
    if (eligibleCount === 0) {
      result.waitingForPool++
      result.details.push({
        senderEmail: schedule.email,
        status: 'waiting_for_pool',
      })
      continue
    }

    for (let i = 0; i < remaining; i++) {
      result.attempted++

      // compare-and-swap first; prevents double-send under concurrent cron
      const incremented = await incrementSentTodayIfBelowTarget(schedule.id)
      if (!incremented) {
        result.skipped++
        break
      }

      const recipient = await pickWarmingRecipient(
        schedule.emailAccountId,
        schedule.userId
      )
      if (!recipient) {
        // Another concurrent run grabbed the only recipient. Not fatal.
        result.skipped++
        result.details.push({
          senderEmail: schedule.email,
          status: 'skipped',
        })
        continue
      }

      const template = pickRandomWarmingTemplate()
      const token = nanoid(16)
      const warmingMessageId = `wm_${nanoid(12)}`

      await createWarmingMessage({
        id: warmingMessageId,
        senderAccountId: schedule.emailAccountId,
        recipientAccountId: recipient.id,
        warmingToken: token,
        subject: template.subject,
        bodyPreview: template.body.slice(0, 80),
        status: 'pending',
      })

      const sendResult = await sendEmail(schedule.emailAccountId, {
        to: recipient.email,
        subject: template.subject,
        bodyText: template.body,
        trackingId: null, // skip tracking injection for warming traffic
        extraHeaders: [['X-Coldflow-Warming', token]],
      })

      if (sendResult.success && sendResult.messageId) {
        await markWarmingMessageSent(warmingMessageId, sendResult.messageId)
        result.sent++
        result.details.push({
          senderEmail: schedule.email,
          recipientEmail: recipient.email,
          status: 'sent',
        })
      } else {
        await markWarmingMessageFailed(
          warmingMessageId,
          sendResult.error ?? 'unknown'
        )
        result.failed++
        result.details.push({
          senderEmail: schedule.email,
          recipientEmail: recipient.email,
          status: 'failed',
          error: sendResult.error,
        })
      }
    }
  }

  return result
}
