import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AccountEmailField } from '@/accounts/AccountEmailField'

interface Props {
  mode: 'login' | 'register'
  busy: boolean
  onSubmit: (email: string, password: string) => Promise<void>
}

export function AccountCredentialsForm({ mode, busy, onSubmit }: Props) {
  const { t } = useTranslation('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <form onSubmit={event => {
      event.preventDefault()
      void onSubmit(email, password).then(() => setPassword(''))
    }}>
      <FieldGroup>
        <AccountEmailField id={`${mode}-email`} value={email} onChange={setEmail} disabled={busy} />
        <Field data-disabled={busy}>
          <FieldLabel htmlFor={`${mode}-password`}>{t('password')}</FieldLabel>
          <Input id={`${mode}-password`} type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required minLength={mode === 'register' ? 12 : undefined} maxLength={128}
            value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          {mode === 'register' && <FieldDescription>{t('passwordHint')}</FieldDescription>}
        </Field>
        <Button type="submit" disabled={busy}>{t(mode)}</Button>
      </FieldGroup>
    </form>
  )
}
