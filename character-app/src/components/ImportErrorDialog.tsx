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

  // Handle keyed errors like 'validation.import.missingStringField:fieldName'
  const colonIdx = code.lastIndexOf(':')
  if (colonIdx !== -1) {
    const key = code.slice(0, colonIdx)
    const fieldName = code.slice(colonIdx + 1)
    const subKey = key.replace('validation.import.', '')
    return t(`import.${subKey}`, { key: fieldName, defaultValue: code })
  }

  const subKey = code.replace('validation.import.', '')
  return t(`import.${subKey}`, { defaultValue: code })
}

export function ImportErrorDialog({ open, message, onClose }: Props) {
  const { t } = useTranslation('validation')
  const { t: tCommon } = useTranslation('common')
  const localizedMessage = useLocalizedError(message)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('import.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('import.dialogDescription')}
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
