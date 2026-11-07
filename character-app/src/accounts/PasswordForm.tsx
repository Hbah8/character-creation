import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface Props {
  change: boolean
  busy: boolean
  onSubmit: (current: string, password: string) => Promise<void>
}

export function PasswordForm({ change, busy, onSubmit }: Props) {
  const { t } = useTranslation('account')
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [mismatch, setMismatch] = useState(false)
  return <form onSubmit={event => {
    event.preventDefault()
    if (password !== confirmation) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    void onSubmit(current, password)
  }}>
    <FieldGroup>
      {change && <Field>
        <FieldLabel htmlFor="current-password">{t('currentPassword')}</FieldLabel>
        <Input id="current-password" type="password" autoComplete="current-password" required maxLength={128}
          disabled={busy} value={current} onChange={event => setCurrent(event.target.value)} />
      </Field>}
      <Field>
        <FieldLabel htmlFor="new-password">{t('newPassword')}</FieldLabel>
        <Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}
          disabled={busy} value={password} onChange={event => setPassword(event.target.value)} />
        <FieldDescription>{t('passwordHint')}</FieldDescription>
      </Field>
      <Field data-invalid={mismatch}>
        <FieldLabel htmlFor="confirm-new-password">{t('confirmNewPassword')}</FieldLabel>
        <Input id="confirm-new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}
          disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-invalid={mismatch} />
        {mismatch && <FieldDescription role="alert">{t('passwordMismatch')}</FieldDescription>}
      </Field>
      <Button type="submit" disabled={busy}>{t(change ? 'changePassword' : 'saveNewPassword')}</Button>
    </FieldGroup>
  </form>
}
