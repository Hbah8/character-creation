import { useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function useOperationError(
  message: string | null,
  action?: { label: string; onClick: () => void },
  occurrence?: object | number | null,
) {
  const id = useId()
  const { t } = useTranslation('common')
  useEffect(() => {
    if (message) {
      toast.error(t('error'), {
        id,
        description: message,
        duration: Infinity,
        action: action && {
          label: action.label,
          onClick: event => {
            event.preventDefault()
            action.onClick()
          },
        },
      })
    } else {
      toast.dismiss(id)
    }
    return () => { toast.dismiss(id) }
  }, [id, message, action, occurrence, t])
}
