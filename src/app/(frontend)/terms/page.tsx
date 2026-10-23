import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Coldflow',
  description:
    'Terms of service for Coldflow, an open-source cold-email tool.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: October 23, 2026
        </p>

        <h2>1. What Coldflow is</h2>
        <p>
          Coldflow is open-source cold-email infrastructure available at
          github.com/jaredzwick/coldflow. It is a tool for sending outbound
          email on behalf of its operator. You are the sender.
        </p>

        <h2>2. Your account</h2>
        <p>
          By creating an account on coldflow.dev you confirm that you are at
          least 18 years old and are authorized to send email on behalf of any
          mailbox you connect. Keep your login credentials private. You are
          responsible for everything that happens under your account.
        </p>

        <h2>3. Your responsibilities as a sender</h2>
        <ul>
          <li>
            You will comply with CAN-SPAM (United States), CASL (Canada), GDPR
            (European Union) and any other law that applies to your sending.
          </li>
          <li>
            You will include a working unsubscribe mechanism and will honor
            unsubscribe requests promptly.
          </li>
          <li>
            You will not send on behalf of a mailbox you do not own or are not
            explicitly authorized to use.
          </li>
          <li>
            You will not send to purchased or scraped lists you cannot show a
            lawful basis for, you will not spoof identity, and you will not
            send content you know to be deceptive, fraudulent, illegal, or
            targeting a protected class with harassment.
          </li>
          <li>
            You are the sender for all deliverability, reputation, and
            abuse-handling purposes. We are not.
          </li>
        </ul>

        <h2>4. Account suspension</h2>
        <p>
          We may suspend or terminate an account that is clearly violating
          Section 3, that is generating abuse reports from mailbox providers,
          or that is actively harming other users of Coldflow. We will
          generally reach out first. We may act without notice for ongoing
          abuse.
        </p>

        <h2>5. Self-hosting</h2>
        <p>
          Coldflow is open-source under the license declared in the GitHub
          repository. You may self-host for yourself or your organization
          subject to that license. These terms do not restrict self-hosted
          use except Section 3, which applies regardless of host.
        </p>

        <h2>6. Service availability</h2>
        <p>
          The hosted service at coldflow.dev is provided &quot;as is.&quot; We
          do not guarantee uptime, delivery rates, or that any specific
          message will land in a recipient&apos;s inbox. Spam-filter decisions
          are made by third-party mailbox providers over which we have no
          control.
        </p>

        <h2>7. Third-party services</h2>
        <p>
          Coldflow connects to Google (Gmail API) and may connect to other
          providers. Your use of those services is also subject to the
          provider&apos;s terms, including Google&apos;s{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            API Services User Data Policy
          </a>{' '}
          and{' '}
          <a
            href="https://support.google.com/mail/answer/81126"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gmail Sender Guidelines
          </a>
          .
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Coldflow and its contributors
          are not liable for lost profits, lost revenue, reputational damage,
          or any indirect, incidental, special, or consequential damages
          arising from your use of the service. Our total aggregate liability
          to you for any claim is limited to the greater of (a) amounts you
          paid for the hosted service in the twelve months before the claim,
          or (b) US$50.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these terms. Material changes will be surfaced on the
          site; continued use after the change means you accept the updated
          terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions: hello@coldflow.dev. Security issues:
          security@coldflow.dev. Abuse reports: abuse@coldflow.dev.
        </p>
      </div>
    </div>
  )
}
