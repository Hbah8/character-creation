import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { accountApi, AccountApiError } from '@/accounts/accountApi'
import type { AccountErrorCode, AccountSession } from '@/accounts/accountApi'
import { useSessionAccount } from '@/accounts/useSessionAccount'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function AccountPage() {
  const { t, i18n } = useTranslation('account')
  const account = useSessionAccount()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<AccountSession[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<AccountErrorCode | null>(null)

  useEffect(() => {
    let active = true
    accountApi.sessions().then(entries => {
      if (active) setSessions(entries)
    }).catch((failure: unknown) => {
      if (active) setError(failure instanceof AccountApiError ? failure.code : 'unavailable')
    }).finally(() => {
      if (active) setBusy(false)
    })
    return () => { active = false }
  }, [])

  async function perform(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (failure) {
      setError(failure instanceof AccountApiError ? failure.code : 'unavailable')
    } finally {
      setBusy(false)
    }
  }

  const date = (value: string) => new Date(value).toLocaleString(i18n.language)
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {error && <Alert variant="destructive"><AlertDescription>{t(`errors.${error}`)}</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle>{account.email}</CardTitle>
          <CardDescription>{t('sessions')}</CardDescription>
        </CardHeader>
        <CardContent>
          {busy && <p role="status">{t('loadingSessions')}</p>}
          <ul className="flex flex-col gap-4" aria-label={t('sessions')}>
            {sessions.map(session => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1 text-sm">
                  {session.current && <Badge variant="secondary">{t('currentSession')}</Badge>}
                  <span>{t('createdAt', { date: date(session.createdAt) })}</span>
                  <span>{t('lastAccessAt', { date: date(session.lastAccessAt) })}</span>
                  <span>{t('expiresAt', { date: date(session.expiresAt) })}</span>
                </div>
                <Button variant="outline" disabled={busy} onClick={() => void perform(async () => {
                  await accountApi.revoke(session.id)
                  if (session.current) {
                    navigate('/login', { replace: true, state: { returnTo: '/account' } })
                  } else {
                    setSessions(await accountApi.sessions())
                  }
                })}>{t('revoke')}</Button>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={busy}
            onClick={() => void perform(async () => setSessions(await accountApi.sessions()))}>{t('refresh')}</Button>
          <Button disabled={busy} onClick={() => void perform(() => accountApi.logout())}>{t('logout')}</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
