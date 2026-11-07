import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const emailPattern = '[^\\s@]+@[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)+'

interface Props {
  id: string
  value: string
  disabled: boolean
  onChange: (email: string) => void
}

export function AccountEmailField({ id, value, disabled, onChange }: Props) {
  const { t } = useTranslation('account')
  const [invalid, setInvalid] = useState(false)
  return (
    <Field data-disabled={disabled} data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{t('email')}</FieldLabel>
      <Input id={id} type="email" autoComplete="email" required maxLength={254}
        pattern={emailPattern} value={value} disabled={disabled}
        aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={event => {
          onChange(event.target.value)
          if (invalid) setInvalid(!event.target.validity.valid)
        }}
        onBlur={event => setInvalid(Boolean(event.target.value) && !event.target.validity.valid)}
        onInvalid={event => {
          event.preventDefault()
          setInvalid(true)
        }} />
      {invalid && <FieldDescription id={`${id}-error`} role="alert">{t('invalidEmail')}</FieldDescription>}
    </Field>
  )
}
