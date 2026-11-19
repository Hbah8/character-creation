import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CharacterDraft } from '@/services/characterDraftRepository'

interface Props {
  draft: CharacterDraft
  onOpen: (draft: CharacterDraft) => void
  onDelete: (draft: CharacterDraft) => Promise<void>
}

export function CharacterDraftItem({ draft, onOpen, onDelete }: Props) {
  const { t, i18n } = useTranslation('library')
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-medium">{draft.character.callsign || draft.character.name || t('unnamed')}</span>
        <span className="text-sm text-muted-foreground">{t('drafts.label')}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('drafts.localOnly')}>
              <AlertTriangle />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('drafts.localOnly')}</TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground">
        {new Date(draft.modifiedAt).toLocaleString(i18n.resolvedLanguage)}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onOpen(draft)}>{t('drafts.continue')}</Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>{t('drafts.delete')}</Button>
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drafts.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('drafts.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void onDelete(draft)}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
