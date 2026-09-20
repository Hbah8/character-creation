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
  warnings: string[]
  onClose: () => void
}

export function getImportWarningTranslationKey(warning: string): string {
  return `import.${warning.replace('validation.import.', '')}`
}

export function ImportWarningsDialog({ warnings, onClose }: Props) {
  const { t } = useTranslation('validation')
  const { t: tCommon } = useTranslation('common')

  return (
    <Dialog open={warnings.length > 0} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('import.warningTitle')}</DialogTitle>
          <DialogDescription>{t('import.warningDescription')}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 text-sm">
          {warnings.map(warning => (
            <li key={warning} className="border border-border bg-muted p-3">
              {t(getImportWarningTranslationKey(warning), { defaultValue: warning })}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose}>{tCommon('ok')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}