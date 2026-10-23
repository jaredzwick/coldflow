'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Server, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailAccountModal } from '@/components/EmailAccountManagement'

interface EmailAccount {
  id: string
  email: string
  provider: 'gmail' | 'outlook' | 'imap'
  status: 'connected' | 'error' | 'disconnected' | string
  dailyQuota: number
  quotaUsedToday: number
  lastSyncedAt: string | null
  errorMessage: string | null
  createdAt: string
}

const ERROR_LABELS: Record<string, string> = {
  account_already_connected: 'That email account is already connected.',
  missing_parameters: 'OAuth response was missing required parameters.',
  invalid_state: 'OAuth state failed verification — try again.',
  connection_failed: 'Connection failed. Try again or check logs.',
  access_denied: 'You denied access on the Google consent screen.',
}

export default function EmailAccountsPage() {
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [banner, setBanner] = useState<
    { kind: 'success' | 'error'; message: string } | null
  >(null)

  const successEmail = searchParams.get('email')
  const successCode = searchParams.get('success')
  const errorCode = searchParams.get('error')

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/email-accounts')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFetchError(data.error || 'Failed to load email accounts')
        return
      }
      setAccounts(data.accounts ?? [])
    } catch {
      setFetchError('Network error loading email accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  useEffect(() => {
    if (successCode === 'account_connected' && successEmail) {
      setBanner({
        kind: 'success',
        message: `Connected ${successEmail}.`,
      })
      return
    }
    if (errorCode) {
      setBanner({
        kind: 'error',
        message: ERROR_LABELS[errorCode] || `Error: ${errorCode}`,
      })
    }
  }, [successCode, successEmail, errorCode])

  const handleDisconnect = async (id: string, email: string) => {
    if (!confirm(`Disconnect ${email}? Pending emails for this account stop sending.`)) return
    const res = await fetch(`/api/email-accounts/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBanner({
        kind: 'error',
        message: data.error || `Failed to disconnect ${email}`,
      })
      return
    }
    setBanner({ kind: 'success', message: `Disconnected ${email}.` })
    fetchAccounts()
  }

  const providerIcon = (provider: EmailAccount['provider']) => {
    if (provider === 'imap') return <Server className="h-5 w-5 text-gray-600" />
    return <Mail className="h-5 w-5 text-red-600" />
  }

  const statusBadge = (status: EmailAccount['status']) => {
    const color =
      status === 'connected'
        ? 'bg-green-100 text-green-800'
        : status === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800'
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Connect inboxes you want to send cold email from.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Connect Email Account</Button>
      </div>

      {banner && (
        <div
          className={`rounded-md p-3 text-sm ${
            banner.kind === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
          role="status"
        >
          {banner.message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : fetchError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {fetchError}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No email accounts connected yet. Click <strong>Connect Email Account</strong> above to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-3 text-base font-medium">
                  <span className="flex items-center gap-3">
                    {providerIcon(account.provider)}
                    <span>{account.email}</span>
                    {statusBadge(account.status)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id, account.email)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                <div>
                  Quota today: <strong>{account.quotaUsedToday}</strong> / {account.dailyQuota}
                </div>
                <div>
                  Last synced:{' '}
                  {account.lastSyncedAt
                    ? new Date(account.lastSyncedAt).toLocaleString()
                    : 'never'}
                </div>
                {account.errorMessage && (
                  <div className="text-red-700">Error: {account.errorMessage}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EmailAccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          setModalOpen(false)
          fetchAccounts()
        }}
      />
    </div>
  )
}
