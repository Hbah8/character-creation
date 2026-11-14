import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { accountApi, AccountApiError, onSessionEnded } from '@/accounts/accountApi'
import type { Account, AccountErrorCode } from '@/accounts/accountApi'
import { SessionAccountContext } from '@/accounts/useSessionAccount'
import { AuthenticationPage } from '@/accounts/AuthenticationPage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface SessionCheck {
  key: string
  loading: boolean
  account: Account | null
  error: AccountErrorCode | null
}

export function SessionBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation('account')
  const location = useLocation()
  const [check, setCheck] = useState<SessionCheck>({ key: '', loading: true, account: null, error: null })
  const [retry, setRetry] = useState(0)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const isLogin = location.pathname === '/login'
  const hashParams = new URLSearchParams(location.hash.slice(1))
  const confirmation = hashParams.has('token') || hashParams.has('resetToken')
  const state: unknown = location.state
  const candidate = state && typeof state === 'object' && 'returnTo' in state ? state.returnTo : null
  const returnTo = typeof candidate === 'string' && candidate.startsWith('/')
    && !candidate.startsWith('//') && !candidate.includes('\\') && !/^\/login(?:[/?#]|$)/.test(candidate)
    ? candidate : '/'

  useEffect(() => {
    let active = true
    let sequence = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const key = location.key

    function scheduleExpiry(account: Account) {
      const remaining = Date.parse(account.expiresAt) - Date.now()
      timer = setTimeout(() => {
        if (remaining > 86400000) scheduleExpiry(account)
        else void verify()
      }, Math.min(Math.max(remaining, 1000), 86400000))
    }

    async function verify() {
      const request = ++sequence
      clearTimeout(timer)
      // Rechecking the same session must not unmount editors or native file inputs.
      setCheck(previous => previous.key === key && !previous.loading && (isLogin || previous.account !== null)
        ? previous : { key, loading: true, account: null, error: null })
      try {
        const account = await accountApi.current()
        if (!active || request !== sequence) return
        setCheck({ key, loading: false, account, error: null })
        if (account) {
          // A bounded timeout, not polling: background requests would renew idle sessions.
          scheduleExpiry(account)
        }
      } catch (failure) {
        if (active && request === sequence) {
          setCheck({ key, loading: false, account: null,
            error: failure instanceof AccountApiError ? failure.code : 'unavailable' })
        }
      }
    }

    const unsubscribe = onSessionEnded(reason => {
      ++sequence
      clearTimeout(timer)
      setPasswordChanged(reason === 'passwordChanged')
      setCheck({ key, loading: false, account: null, error: null })
    })
    const focus = () => { void verify() }
    const visible = () => { if (document.visibilityState === 'visible') void verify() }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', visible)
    void verify()
    return () => {
      active = false
      clearTimeout(timer)
      unsubscribe()
      window.removeEventListener('focus', focus)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [location.key, isLogin, retry])

  // Already-issued email links remain public without exposing the account layout.
  if (location.pathname === '/account' && confirmation) {
    return <Navigate to={{ pathname: '/login', hash: location.hash }} replace state={location.state} />
  }
  if (check.key !== location.key || check.loading) {
    return <main className="p-6" role="status">{t('checkingSession')}</main>
  }
  if (isLogin) {
    if (check.account && !confirmation) return <Navigate to={returnTo} replace />
    return <AuthenticationPage key={location.hash} error={check.error} onAuthenticated={account =>
      setCheck({ key: location.key, loading: false, account, error: null })} />
  }
  if (check.error) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-6">
        <Alert variant="destructive"><AlertDescription>{t(`errors.${check.error}`)}</AlertDescription></Alert>
        <Button onClick={() => setRetry(value => value + 1)}>{t('retry')}</Button>
      </main>
    )
  }
  if (!check.account) {
    return <Navigate to="/login" replace
      state={{ returnTo: location.pathname + location.search + location.hash, passwordChanged }} />
  }
  return <SessionAccountContext key={check.account.id} value={check.account}>
    {!check.account.approved && <Alert className="m-4" role="status">
      <AlertDescription>{t('pendingApproval')}</AlertDescription>
    </Alert>}
    {children}
  </SessionAccountContext>
}
