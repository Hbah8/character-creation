import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { accountApi, AccountApiError } from '@/accounts/accountApi'
import type { Account, AccountErrorCode } from '@/accounts/accountApi'
import { AccountCredentialsForm } from '@/accounts/AccountCredentialsForm'
import { AccountResendForm } from '@/accounts/AccountResendForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  error: AccountErrorCode | null
  onAuthenticated: (account: Account) => void
}

export function AuthenticationPage({ error: sessionError, onAuthenticated }: Props) {
  const { t } = useTranslation('account')
  const location = useLocation()
  const navigate = useNavigate()
  const [initialToken] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token') ?? '')
  const [busy, setBusy] = useState(Boolean(initialToken))
  const [error, setError] = useState<AccountErrorCode | null>(null)
  const [message, setMessage] = useState<'mailAccepted' | null>(null)
  const [step, setStep] = useState<'login' | 'register' | 'checkEmail' | 'confirming' | 'confirmed' | 'confirmationFailed'>(
    initialToken ? 'confirming' : 'login')
  const [email, setEmail] = useState('')
  const confirmation = useRef<Promise<void> | null>(null)
  const displayedError = error ?? sessionError
  const title = step === 'login' ? 'loginTitle' : step === 'register' ? 'registerTitle'
    : step === 'checkEmail' ? 'checkEmail' : step === 'confirming' ? 'confirming'
      : step === 'confirmed' ? 'confirmedTitle' : 'confirmationFailed'

  useEffect(() => {
    // Remove secrets from browser history; retain router state for deep-link return.
    if (location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }, [location.hash])

  useEffect(() => {
    if (!initialToken) return
    // StrictMode must not consume the same one-use token twice.
    confirmation.current ??= accountApi.confirm(initialToken)
    let active = true
    void confirmation.current.then(() => {
      if (active) setStep('confirmed')
    }).catch((failure: unknown) => {
      if (active) {
        setError(failure instanceof AccountApiError ? failure.code : 'unavailable')
        setStep('confirmationFailed')
      }
    }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [initialToken])

  function changeStep(next: 'login' | 'register' | 'checkEmail') {
    setError(null)
    setMessage(null)
    setStep(next)
  }

  async function perform(action: () => Promise<void>, mailSent = false) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await action()
      if (mailSent) {
        setMessage('mailAccepted')
        setStep('checkEmail')
      }
    } catch (failure) {
      setError(failure instanceof AccountApiError ? failure.code : 'unavailable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle><h1>{t(title)}</h1></CardTitle>
          {step === 'checkEmail' && <CardDescription>{t('checkEmailInstruction')}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {displayedError && <Alert variant="destructive">
            <AlertDescription>{t(`errors.${displayedError}`)}</AlertDescription>
          </Alert>}
          {message && <Alert role="status"><AlertDescription>{t(message)}</AlertDescription></Alert>}
          {step === 'confirming' && <p role="status">{t('confirming')}</p>}
          {step === 'confirmed' && <Alert role="status"><AlertDescription>{t('confirmed')}</AlertDescription></Alert>}
          {(step === 'login' || step === 'register') &&
            <AccountCredentialsForm key={step} mode={step} busy={busy} onSubmit={(address, password) => {
              setEmail(address)
              return perform(async () => {
                if (step === 'register') {
                  await accountApi.register(address, password)
                } else {
                  const account = await accountApi.login(address, password)
                  // Confirmation may have left a token in the router's in-memory location.
                  if (location.hash) {
                    navigate('/login', { replace: true, state: location.state })
                  } else {
                    onAuthenticated(account)
                  }
                }
              }, step === 'register')
            }} />}
          {step === 'login' && error === 'emailUnverified' &&
            <Button variant="link" disabled={busy} onClick={() => changeStep('checkEmail')}>{t('resend')}</Button>}
          {(step === 'checkEmail' || step === 'confirmationFailed') &&
            <AccountResendForm initialEmail={email} busy={busy} onResend={address => {
              setEmail(address)
              return perform(() => accountApi.resend(address), true)
            }} />}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {step === 'login'
            ? <Button variant="link" disabled={busy} onClick={() => changeStep('register')}>{t('createAccount')}</Button>
            : step !== 'confirming' &&
              <Button variant="link" disabled={busy} onClick={() => changeStep('login')}>{t('backToLogin')}</Button>}
        </CardFooter>
      </Card>
    </main>
  )
}
