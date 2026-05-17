import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  message: string
  onClose: () => void
}

function useLocalizedError(code: string): string {
  const { t } = useTranslation('validation')

  if (!code) return ''

  const isWorldError = code.startsWith('validation.world.')
  const prefix = isWorldError ? 'validation.world.' : 'validation.import.'
  const namespace = isWorldError ? 'world' : 'import'

  // Handle keyed errors like 'validation.import.missingStringField:fieldName'
  const colonIdx = code.lastIndexOf(':')
  if (colonIdx !== -1) {
    const key = code.slice(0, colonIdx)
    const fieldName = code.slice(colonIdx + 1)
    const subKey = key.replace(prefix, '')
    return t(`${namespace}.${subKey}`, { key: fieldName, defaultValue: code })
  }

  const subKey = code.replace(prefix, '')
  return t(`${namespace}.${subKey}`, { defaultValue: code })
}

export function ImportErrorDialog({ open, message, onClose }: Props) {
  const { t } = useTranslation('validation')
  const { t: tCommon } = useTranslation('common')
  const localizedMessage = useLocalizedError(message)
  const isWorldError = message.startsWith('validation.world.')
  const section = isWorldError ? 'world' : 'import'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(`${section}.dialogTitle`)}</DialogTitle>
          <DialogDescription>
            {t(`${section}.dialogDescription`)}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md p-3">
          {localizedMessage}
        </p>
        <DialogFooter>
          <Button onClick={onClose}>{tCommon('ok')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
