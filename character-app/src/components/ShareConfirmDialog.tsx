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
  callsign: string
  portraitStripped: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ShareConfirmDialog({ open, callsign, portraitStripped, onConfirm, onCancel }: Props) {
  const { t } = useTranslation('share')
  const { t: tCommon } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>
            {t('confirmDescription')} <strong>{callsign || '—'}</strong>
          </DialogDescription>
        </DialogHeader>
        {portraitStripped && (
          <p className="text-sm text-muted-foreground border border-border bg-muted/40 rounded-md p-3">
            {t('portraitWarning')}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{tCommon('cancel')}</Button>
          <Button onClick={onConfirm}>{t('loadButton')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
