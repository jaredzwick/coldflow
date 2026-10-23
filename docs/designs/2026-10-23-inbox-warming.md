# Inbox Warming — Design & Delivery

**Date:** 2026-10-23
**Status:** Phase 1 in flight
**Owner:** jaredzwick

## Problem

A new Gmail inbox has zero sender reputation. Day one of real cold outreach
lands 60-80% in Spam or Promotions. Warming (3-4 weeks of bot-generated
conversational traffic that gets opened, replied, starred, and pulled out of
Spam) raises reputation so campaign send #1 actually lands.

Product promise of this feature: **"flip one switch, 30 days later your
sender reputation is pro-level, your campaigns actually land."**

## Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D1 | Pool model | **B — Hybrid (peer pool + user-added coach inboxes)** | Peer pool is the industry standard; coach-inbox escape hatch keeps the pool usable before network effects kick in. |
| D2 | OAuth scope expansion | **A — Expand base scopes now, force reauth** | One consent screen covers send + warming forever. Only one user currently connected, so forced reauth cost is zero. |
| D3 | MVP ambition | **B — Send-only MVP first, phased delivery** | Lets Jared dogfood warming on his own inbox 3-4 days from now. Receiver side + reply bot land in Phase 2. |

## UX (the whole UX)

On `/dashboard/email-accounts`, each connected inbox card gains an inline
Warming section. No separate page. No campaign wizard.

```
┌──────────────────────────────────────────────────────┐
│  ✉ jareddzwick@gmail.com    [connected] [Disconnect] │
│  Quota today: 2 / 500                                │
│                                                      │
│  ─── Warming ───────────────────────────────  [●On]  │
│  Day 7 of 30 · 15 sent today · 12 inbox, 1 spam     │
│  ████████░░░░░░░░░░░░░░░░░░░░  23% to full strength │
│  [View details]                                      │
└──────────────────────────────────────────────────────┘
```

Default ramp is correct for 99% of users. Expose knobs only on explicit
Advanced click (not shipped in Phase 1).

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Vercel Cron                                                  │
│    /api/cron/warm-send    (every 15 min)                      │
│    /api/cron/warm-roll    (daily 00:00 UTC)                   │
│    /api/cron/warm-receive (every 15 min, Phase 2)             │
└──────────────┬────────────────────────────────────────────────┘
               │
               ▼
     ┌────────────────────┐      ┌──────────────────────┐
     │ warmingSender      │      │ warmingReceiver (P2) │
     │ - pick accounts    │      │ - IMAP poll per acct │
     │   due to send      │      │ - find warming msgs  │
     │ - pick recipients  │      │ - mark read + star   │
     │   from peer pool   │      │ - pull from spam     │
     │ - generate content │      │ - schedule reply     │
     │ - gmailService send│      │                      │
     └─────────┬──────────┘      └──────────┬───────────┘
               │                            │
               ▼                            ▼
      ┌───────────────────────────────────────────┐
      │  warming_schedule, warming_message tables │
      └───────────────────────────────────────────┘
```

## Data model

Two new tables, additive. Nothing changes in existing tables.

```sql
-- warming lifecycle status
CREATE TYPE warming_status AS ENUM ('off', 'ramping', 'maintenance', 'paused');

-- per-account warming configuration + daily state
CREATE TABLE warming_schedule (
  id text PRIMARY KEY,
  email_account_id text NOT NULL UNIQUE REFERENCES email_account(id) ON DELETE CASCADE,
  status warming_status NOT NULL DEFAULT 'off',
  started_at timestamp,
  day_number int NOT NULL DEFAULT 0,
  target_volume_today int NOT NULL DEFAULT 0,
  sent_today int NOT NULL DEFAULT 0,
  volume_reset_at timestamp,
  inbox_count_7d int NOT NULL DEFAULT 0,
  spam_count_7d int NOT NULL DEFAULT 0,
  reply_count_7d int NOT NULL DEFAULT 0,
  max_daily_cap int NOT NULL DEFAULT 40,
  ramp_days int NOT NULL DEFAULT 30,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- warming message lifecycle
CREATE TYPE warming_message_status AS ENUM (
  'pending', 'sent', 'landed_inbox', 'landed_spam',
  'pulled_from_spam', 'replied', 'failed'
);

-- audit trail + spam detector
CREATE TABLE warming_message (
  id text PRIMARY KEY,
  sender_account_id text NOT NULL REFERENCES email_account(id) ON DELETE CASCADE,
  recipient_account_id text NOT NULL REFERENCES email_account(id) ON DELETE CASCADE,
  warming_token text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_preview text,
  gmail_message_id text,
  recipient_gmail_message_id text,
  status warming_message_status NOT NULL DEFAULT 'pending',
  sent_at timestamp,
  landed_at timestamp,
  pulled_from_spam_at timestamp,
  replied_at timestamp,
  error_message text,
  created_at timestamp NOT NULL DEFAULT now()
);
```

## Ramp curve

Linear ramp over `ramp_days` (default 30), hard-capped at `max_daily_cap`
(default 40). Day 1 = 5 emails, each subsequent day +(cap-5)/(ramp_days-1),
reaching cap on day `ramp_days`. Past ramp_days, status flips to
`maintenance` and stays at cap indefinitely.

## Pool selection

For every send, pick a recipient uniformly from accounts where:
- `warming_schedule.status IN ('ramping', 'maintenance')`
- `recipient != sender`
- No warming message sent from this sender to this recipient in last 24h
- Prefer recipients from a different `user_id` when at least one exists
  (multi-tenant abuse prevention, enforced in Phase 3 as hard rule)

Hybrid (D1=B) means user-added coach inboxes are first-class
`email_account` rows with `warming_schedule.status = 'maintenance'` from
day 0. UI for adding them lands in Phase 2.

## Scope expansion (D2=A)

`src/lib/googleOAuth.ts` requests on next connect:
- Existing: `gmail.send`
- Added: `gmail.readonly`, `gmail.modify`

(`gmail.labels` is intentionally not requested — `gmail.modify` already
grants label CRUD per Google's docs, and the GCP console hides the
redundant scope.)

Any existing account with `scopes` not containing the new set triggers a
banner on `/dashboard/email-accounts`: "Reconnect to enable warming".
Only one account currently exists, so impact is minimal.

GCP OAuth consent screen needs the new scopes added before deploy. Jared
owns that.

## Delivery phases (D3=B)

### Phase 1 (this PR, 3-4 days of focused work compressed into one session)

- Schema: `warming_schedule`, `warming_message` tables + enums
- Migration SQL generated via drizzle-kit
- `src/lib/warmingSender.ts` worker
- `src/lib/templates/catalog.ts` extended with `warming` category (~15 natural templates)
- `/api/cron/warm-send` (every 15 min)
- `/api/cron/warm-roll` (daily 00:00 UTC)
- `/api/email-accounts/[id]/warming` toggle endpoint
- `/api/email-accounts` GET includes `warming` field per account
- OAuth scope expansion
- Dashboard UI: inline warming section on each account card with toggle + status line + progress bar

**Degradation:** with warming on but only 1 account in the pool,
`target_volume_today` sets to 0 and status reads "Waiting for peers (invite
another inbox or wait for the pool to grow)". No cascading failure.

### Phase 2 (~5 days)

- IMAP receiver worker + Gmail XOAUTH2 IMAP connection
- Inbox/spam detection via `X-Coldflow-Warming` header
- Spam-rescue automation (move to Inbox, star, mark important)
- Days-7 health counters populated from receiver side
- UI health card: inbox rate, spam rate, pulled-from-spam count
- Red/yellow banner heuristics
- Coach inbox add flow (D1=B hybrid)

### Phase 3 (~3 days)

- Reply bot (randomized reply generation + scheduling 2-24h delay)
- Per-recipient rate limits (max 3/day from any sender)
- Multi-tenant abuse guardrails
- Details modal: per-day volume history, last 20 messages, health score

### Phase 4 (ongoing)

- Auto-pause heuristics
- Health score 0-100
- Dashboard sparkline

## Failure modes

| Failure | Symptom | Phase 1 response |
|---|---|---|
| Only one account exists | Nobody to send to | `target_volume_today = 0`, status "Waiting for peers" |
| Gmail send 401/403 | Token revoked or scope downgrade | Flip `warming_schedule.status = 'paused'`, show reauth banner |
| Gmail quota hit mid-day | 429 or quota exceeded | Hold warming send, resume next day; share `email_account.daily_quota` |
| Cron fires twice | Race on `sent_today++` | Use SQL `UPDATE ... SET sent_today = sent_today + 1 WHERE sent_today < target_volume_today` as compare-and-swap |
| User disconnects account mid-ramp | FK cascade kills warming_schedule | Fine; schedule rebuilds on reconnect |
| Pool-pollution: user keeps toggling | Thrashes schedule | Preserve `started_at` and `day_number` across off → on within 24h |

## Env vars needed

- `CRON_SECRET` — Vercel-generated, used by cron routes to authorize themselves
- (existing) `GMAIL_ENCRYPTION_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, etc.

## Open questions deferred to Phase 2+

- How does a user add a coach inbox they own? Same connect flow + checkbox "treat as coach"?
- Should warming count against `email_account.daily_quota` or get its own budget? Current call: shares the 500/day Gmail quota (safer).
- Reply content generation: template catalog or LLM-generated? Phase 3 call.
