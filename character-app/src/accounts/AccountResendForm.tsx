import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { AccountEmailField } from '@/accounts/AccountEmailField'

interface Props {
  initialEmail: string
  busy: boolean
  onResend: (email: string) => Promise<void>
}

export function AccountResendForm({ initialEmail, busy, onResend }: Props) {
  const { t } = useTranslation('account')
  const [email, setEmail] = useState(initialEmail)
  return (
      <form onSubmit={event => {
        event.preventDefault()
        void onResend(email)
      }}>
        <FieldGroup>
          <AccountEmailField id="resend-email" value={email} onChange={setEmail} disabled={busy} />
          <Button type="submit" variant="outline" disabled={busy}>{t('resend')}</Button>
        </FieldGroup>
      </form>
  )
}
