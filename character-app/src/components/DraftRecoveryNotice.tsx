import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import type { DraftStorageErrorCode, EntityDraft } from '@/services/entityDraftStore'

interface Props<T> {
  drafts: EntityDraft<T>[]
  storageError: DraftStorageErrorCode | null
  serverChecked: boolean
  currentVersion: number | null
  onRestore: (draft: EntityDraft<T>) => void
  onDelete: (draft: EntityDraft<T>) => void
}

export function DraftRecoveryNotice<T>({
  drafts,
  storageError,
  serverChecked,
  currentVersion,
  onRestore,
  onDelete,
}: Props<T>) {
  const { t } = useTranslation('library')

  if (!storageError && drafts.length === 0) return null

  return (
    <div className="flex flex-col gap-2 px-4 pt-2 print:hidden">
      {storageError && (
        <Alert variant="destructive" role="status">
          <AlertDescription>{t(`drafts.storageErrors.${storageError}`)}</AlertDescription>
        </Alert>
      )}
      {drafts.map(draft => {
        const serverChanged = serverChecked
          && !draft.isNew
          && draft.baseVersion !== null
          && currentVersion !== null
          && draft.baseVersion !== currentVersion
        return (
          <Alert key={`${draft.instanceId}:${draft.revision}`} role="status">
            <AlertDescription className="flex flex-col gap-2">
              <p>
                {t('drafts.available', { time: new Date(draft.modifiedAt).toLocaleString() })}
              </p>
              {serverChanged && <p>{t('drafts.serverChanged', {
                baseVersion: String(draft.baseVersion),
                currentVersion,
              })}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onRestore(draft)}>
                  {t('drafts.restore')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(draft)}>
                  {t('drafts.delete')}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
