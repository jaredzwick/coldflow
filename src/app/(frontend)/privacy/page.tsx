import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Coldflow',
  description: 'Privacy policy for Coldflow, an open-source cold-email tool.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: October 23, 2026
        </p>

        <h2>What we collect</h2>
        <p>When you use Coldflow at coldflow.dev we store:</p>
        <ul>
          <li>
            <strong>Account data</strong>: your email address, password hash,
            display name.
          </li>
          <li>
            <strong>Connected mailbox tokens</strong>: OAuth refresh and
            access tokens for each inbox you connect, encrypted at rest with
            AES-256-GCM. These let us send on your behalf and (for the
            warming feature) read inbox state. We never store your password
            for a connected mailbox.
          </li>
          <li>
            <strong>Campaigns and sends</strong>: subject lines, body
            content, recipient lists you upload or type in, delivery status,
            opens and clicks of tracked links.
          </li>
          <li>
            <strong>Warming metadata</strong>: for the inbox-warming feature,
            we record which internal warming messages were sent between your
            account and other users of the warming pool, and whether each
            landed in Inbox or Spam. We do not retain warming message
            bodies in our database beyond a short preview (first 80
            characters) used to debug delivery.
          </li>
          <li>
            <strong>Usage logs</strong>: standard web-server logs (IP, user
            agent, timestamps) retained for 30 days for abuse response and
            debugging.
          </li>
        </ul>

        <h2>Google user data (Gmail API)</h2>
        <p>
          Coldflow&apos;s use of information received from Google APIs adheres
          to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>We request the following Gmail scopes:</p>
        <ul>
          <li>
            <code>gmail.send</code> &mdash; to send campaign and warming
            emails from the inbox you connected.
          </li>
          <li>
            <code>gmail.readonly</code> &mdash; to detect which warming
            messages reached Inbox vs Spam.
          </li>
          <li>
            <code>gmail.modify</code> &mdash; to move warming messages out of
            Spam into Inbox, star them, and mark them as important. This
            improves your sender reputation. We never read or modify
            non-warming messages in your inbox.
          </li>
        </ul>
        <p>
          Access tokens are stored encrypted. You can revoke access at any
          time from{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            your Google account permissions page
          </a>{' '}
          or by disconnecting the inbox in the Coldflow dashboard.
        </p>

        <h2>What we do NOT do</h2>
        <ul>
          <li>We do not sell your data to anyone.</li>
          <li>
            We do not use your Gmail content to train AI models, our own or
            anyone else&apos;s.
          </li>
          <li>
            We do not scan your inbox for anything other than warming
            messages, which we identify via a header we add
            (<code>X-Coldflow-Warming</code>).
          </li>
          <li>
            We do not share your recipient lists with other Coldflow users.
          </li>
        </ul>

        <h2>Who we share data with</h2>
        <ul>
          <li>
            <strong>Hosting</strong>: Vercel (web app) and Neon (database)
            process data on our behalf under their own privacy terms.
          </li>
          <li>
            <strong>Google</strong>: your sending passes through Gmail&apos;s
            API; Google is a controller for the mail content it transmits.
          </li>
          <li>
            <strong>Law enforcement</strong>: only in response to a valid
            legal process.
          </li>
        </ul>

        <h2>Retention and deletion</h2>
        <p>
          You can delete your account from your settings. On deletion we
          purge your account data, connected tokens, campaigns, warming
          schedules and warming messages. Backups are overwritten on a 30-day
          rolling cycle. Server logs tied to deleted accounts are retained up
          to 30 days then rotated out.
        </p>

        <h2>Your rights</h2>
        <p>
          If you are in the EU, UK, California, or another jurisdiction that
          grants statutory privacy rights (GDPR, UK GDPR, CCPA, and similar),
          you have the right to access, correct, export, and delete the
          personal data we hold about you. Email{' '}
          <a href="mailto:privacy@coldflow.dev">privacy@coldflow.dev</a> and
          we will respond within 30 days.
        </p>

        <h2>Children</h2>
        <p>
          Coldflow is not for children under 16. We do not knowingly collect
          data from children. If you believe a child has registered,
          email privacy@coldflow.dev and we will delete the account.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy. Material changes will be surfaced on the
          site. Continued use after the change means you accept the updated
          policy.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions: <a href="mailto:privacy@coldflow.dev">privacy@coldflow.dev</a>.
          Security issues: <a href="mailto:security@coldflow.dev">security@coldflow.dev</a>.
          General: <a href="mailto:hello@coldflow.dev">hello@coldflow.dev</a>.
        </p>
      </div>
    </div>
  )
}
