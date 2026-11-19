import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { useCharacterLibrary } from '@/store/useCharacterLibrary'
import type { Character } from '@/types/character'
import { SavedCharacterApiError } from '@/services/savedCharacterApi'
import { Button } from '@/components/ui/button'
import { useOperationError } from '@/hooks/useOperationError'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Library, Link } from 'lucide-react'
import { encodeCharacterToHash, buildShareUrl } from '@/services/shareService'
import { filterCharactersByWorld } from '@/services/filterCharactersByWorld'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { useSessionAccount } from '@/accounts/useSessionAccount'
import { useCharacterDrafts } from '@/hooks/useCharacterDrafts'
import { CharacterDraftItem } from '@/components/CharacterDraftItem'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CharacterDraft } from '@/services/characterDraftRepository'

interface Props {
  library: ReturnType<typeof useCharacterLibrary>
  isDirty: boolean
  onLoad: (char: Character, updatedAt: string, id: string) => void
  onNewCharacter: () => void
}

export function CharacterLibrary({ library, isDirty, onLoad, onNewCharacter }: Props) {
  const { t } = useTranslation('library')
  const navigate = useNavigate()
  const account = useSessionAccount()
  const draftLibrary = useCharacterDrafts(account.id)
  const { t: tShare } = useTranslation('share')
  const [open, setOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [confirmNewOpen, setConfirmNewOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<
    { type: 'draft'; draft: CharacterDraft } | { type: 'saved'; id: string } | null
  >(null)
  const [deleting, setDeleting] = useState(false)
  const [operationError, setOperationError] = useState<{
    operation: 'load' | 'delete'
    error: SavedCharacterApiError
  } | null>(null)
  const { activeWorldId, loading: worldsLoading } = useWorldLibrary()
  const visibleEntries = filterCharactersByWorld(library.entries, activeWorldId)
  const visibleDrafts = filterCharactersByWorld(draftLibrary.drafts, activeWorldId)
  const savedIds = new Set(visibleEntries.map(entry => entry.id))

  function openDraft(draft: CharacterDraft) {
    const path = savedIds.has(draft.entityId) || !draft.isNew
      ? `/creator/${encodeURIComponent(draft.entityId)}`
      : '/creator'
    setOpen(false)
    navigate(`${path}?draft=${encodeURIComponent(draft.draftId)}`)
  }

  function requestDraft(draft: CharacterDraft) {
    if (isDirty) setPendingSelection({ type: 'draft', draft })
    else openDraft(draft)
  }

  function requestLoad(id: string) {
    if (isDirty) setPendingSelection({ type: 'saved', id })
    else void handleLoad(id)
  }

  function handleShare(id: string, character: Character) {
    const { hash } = encodeCharacterToHash(character)
    const url = buildShareUrl(hash)
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 2000)
    })
  }

  async function handleLoad(id: string) {
    setLoadingId(id)
    setOperationError(null)
    try {
      const record = await library.loadById(id)
      onLoad(record.character, record.updatedAt, record.id)
      setOpen(false)
    } catch (error) {
      setOperationError({ operation: 'load', error: error instanceof SavedCharacterApiError
        ? error
        : new SavedCharacterApiError('unavailable') })
    } finally {
      setLoadingId(null)
    }
  }

  function handleNewCharacterClick() {
    if (isDirty) {
      setConfirmNewOpen(true)
    } else {
      onNewCharacter()
      setOpen(false)
    }
  }

  function handleNewCharacterConfirmed() {
    setConfirmNewOpen(false)
    onNewCharacter()
    setOpen(false)
  }

  async function handleDeleteConfirm() {
    const target = library.entries.find(entry => entry.id === deleteTargetId)
    if (!target) {
      setOperationError({ operation: 'delete', error: new SavedCharacterApiError('notFound') })
      return
    }
    setDeleting(true)
    setOperationError(null)
    try {
      await library.remove(target.id, target.version)
      setDeleteTargetId(null)
    } catch (error) {
      setOperationError({ operation: 'delete', error: error instanceof SavedCharacterApiError
        ? error
        : new SavedCharacterApiError('unavailable') })
    } finally {
      setDeleting(false)
    }
  }

  const visibleError = operationError?.error ?? library.error
  useOperationError(visibleError
    ? operationError && visibleError.code === 'unavailable'
      ? t(operationError.operation === 'delete' ? 'deleteUnavailable' : 'loadUnavailable')
      : t(`errors.${visibleError.code}`)
    : null, undefined, operationError)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Library data-icon="inline-start" />
            {t('openLibrary')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>

          {draftLibrary.error && (
            <Alert variant="destructive">
              <AlertDescription>{t(`drafts.storageErrors.${draftLibrary.error}`)}</AlertDescription>
            </Alert>
          )}
          {library.loading || worldsLoading || draftLibrary.loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground" role="status">
              {t('loadingCharacters')}
            </p>
          ) : library.error && !operationError && visibleDrafts.length === 0 ? (
            <Button size="sm" variant="outline" onClick={() => void library.reload()}>
              {t('retry')}
            </Button>
          ) : visibleEntries.length === 0 && visibleDrafts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('noCharacters')}
            </p>
          ) : (
            <div className="flex flex-col divide-y max-h-96 overflow-y-auto">
              {visibleEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">
                      {entry.character.callsign || t('unnamed')}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.character.name}
                      {entry.character.rank ? ` · ${entry.character.rank}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('lastSaved')}: {new Date(entry.updatedAt).toLocaleString()}
                    </span>
                    {visibleDrafts.filter(draft => draft.entityId === entry.id).map(draft => (
                      <CharacterDraftItem key={draft.draftId} draft={draft} onOpen={requestDraft} onDelete={draftLibrary.remove} />
                    ))}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId !== null}
                      onClick={() => requestLoad(entry.id)}
                    >
                      {loadingId === entry.id ? t('loadingCharacters') : t('load')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare(entry.id, entry.character)}
                    >
                      <Link data-icon="inline-start" />
                      {copiedId === entry.id ? tShare('copied') : tShare('copyLink')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loadingId !== null || deleting}
                      onClick={() => setDeleteTargetId(entry.id)}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              ))}
              {visibleDrafts.filter(draft => !savedIds.has(draft.entityId)).map(draft => (
                <div key={draft.draftId} className="py-3">
                  <CharacterDraftItem draft={draft} onOpen={requestDraft} onDelete={draftLibrary.remove} />
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex justify-start pt-1">
            <Button variant="secondary" onClick={handleNewCharacterClick}>
              {t('newCharacter')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={isOpen => { if (!isOpen) setDeleteTargetId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={() => setDeleteTargetId(null)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={handleDeleteConfirm}>
              {deleting ? t('saving') : t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingSelection !== null} onOpenChange={open => {
        if (!open) setPendingSelection(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('switchTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('switchWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const selection = pendingSelection
              setPendingSelection(null)
              if (selection?.type === 'draft') openDraft(selection.draft)
              else if (selection?.type === 'saved') void handleLoad(selection.id)
            }}>{t('continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes confirmation for new character */}
      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('newCharacter')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unsavedWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleNewCharacterConfirmed}>
              {t('newCharacter')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
