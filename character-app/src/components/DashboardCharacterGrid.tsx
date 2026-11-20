import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, FolderOpen, MoreHorizontal, Shield, Swords, FilePenLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOperationError } from '@/hooks/useOperationError'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CharacterDraft } from '@/services/characterDraftRepository'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  SavedCharacterApiError,
} from '@/services/savedCharacterApi'
import type { SavedCharacterRecord } from '@/services/savedCharacterApi'

interface Props {
  entries: SavedCharacterRecord[]
  onDelete: (id: string, version: number) => Promise<void>
  drafts: CharacterDraft[]
  onDeleteDraft: (draft: CharacterDraft) => Promise<void>
}

export function DashboardCharacterGrid({ entries, onDelete, drafts, onDeleteDraft }: Props) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('library')
  const [pendingDelete, setPendingDelete] = useState<SavedCharacterRecord | null>(null)
  const [pendingDraftDelete, setPendingDraftDelete] = useState<CharacterDraft | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<SavedCharacterApiError | null>(null)
  useOperationError(deleteError
    ? deleteError.code === 'unavailable' ? t('deleteUnavailable') : t(`errors.${deleteError.code}`)
    : null)

  const draftsByEntity = new Map<string, CharacterDraft[]>()
  for (const draft of drafts) {
    const group = draftsByEntity.get(draft.entityId)
    if (group) group.push(draft)
    else draftsByEntity.set(draft.entityId, [draft])
  }
  const savedIds = new Set(entries.map(entry => entry.id))
  const cards = [
    ...entries.map(entry => ({
      key: `saved:${entry.id}`,
      entry,
      character: entry.character,
      updatedAt: entry.updatedAt,
      drafts: draftsByEntity.get(entry.id) ?? [],
      href: `/creator/${encodeURIComponent(entry.id)}`,
    })),
    ...drafts.filter(draft => !savedIds.has(draft.entityId)).map(draft => ({
      key: `draft:${draft.draftId}`,
      entry: null,
      character: draft.character,
      updatedAt: draft.modifiedAt,
      drafts: [draft],
      href: draftHref(draft),
    })),
  ]

  function draftHref(draft: CharacterDraft) {
    const path = savedIds.has(draft.entityId) || !draft.isNew
      ? `/creator/${encodeURIComponent(draft.entityId)}`
      : '/creator'
    return `${path}?draft=${encodeURIComponent(draft.draftId)}`
  }

  if (entries.length === 0 && drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-4 text-center">
        <p className="text-base font-medium text-foreground mb-1">{t('noCharacters')}</p>
        <p className="text-sm text-muted-foreground mb-5">{t('noCharactersDescription')}</p>
        <Button onClick={() => navigate('/creator')}>
          <Plus className="size-4 mr-1.5" />
          {t('newCharacter')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(({ key, entry, character, updatedAt, drafts: cardDrafts, href }) => {
          const name = character.callsign || (entry ? '—' : character.name || t('unnamed'))
          const subtitle = [character.role, character.rank].filter(Boolean).join(' · ')
          const hasMultipleDrafts = cardDrafts.length > 1

          return (
            <Card key={key} className="relative min-w-0 transition-colors hover:bg-accent/40">
              <div className="flex h-32 shrink-0 items-center justify-center bg-muted" aria-hidden="true">
                <span className="select-none text-4xl font-bold text-muted-foreground/40">
                  {Array.from(name)[0].toUpperCase()}
                </span>
              </div>

              <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Link
                    to={href}
                    title={name}
                    className="min-w-0 truncate text-sm font-semibold leading-tight outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                  >
                    {name}
                  </Link>
                  {!entry ? (
                    <Badge variant="secondary">{t('drafts.label')}</Badge>
                  ) : cardDrafts.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          tabIndex={0}
                          role="img"
                          aria-label={t('drafts.changesAvailable')}
                          className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <FilePenLine aria-hidden="true" className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={4}>{t('drafts.changesAvailable')}</TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t('cardActions', { name })}
                        className="relative z-10 -mr-1 ml-auto size-6 shrink-0 text-muted-foreground"
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-max max-w-[min(20rem,calc(100vw-2rem))]">
                      {entry && (
                        <>
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link to={href}>
                                <FolderOpen />
                                {t('open')}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {cardDrafts.map((draft, index) => (
                        <DropdownMenuGroup key={draft.draftId}>
                          {index > 0 && <DropdownMenuSeparator />}
                          {hasMultipleDrafts && (
                            <DropdownMenuLabel className="min-w-0 text-muted-foreground">
                              <span className="block truncate" title={draft.character.callsign || draft.character.name}>
                                {draft.character.callsign || draft.character.name || t('unnamed')}
                              </span>
                              {new Date(draft.modifiedAt).toLocaleString(i18n.resolvedLanguage)}
                            </DropdownMenuLabel>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={draftHref(draft)}>
                              <FilePenLine />
                              {t('drafts.continue')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setPendingDraftDelete(draft)}>
                            <Trash2 />
                            {t(entry ? 'drafts.deleteChanges' : 'drafts.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      ))}
                      {entry && (
                        <>
                          {cardDrafts.length > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuGroup>
                            <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(entry)}>
                              <Trash2 />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                {(character.parry || character.toughness) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {character.parry && (
                      <span className="flex items-center gap-0.5">
                        <Swords className="size-3 shrink-0" />
                        {character.parry}
                      </span>
                    )}
                    {character.toughness && (
                      <span className="flex items-center gap-0.5">
                        <Shield className="size-3 shrink-0" />
                        {character.toughness}
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-auto pt-1 text-xs text-muted-foreground/60">
                  {new Date(updatedAt).toLocaleDateString(i18n.resolvedLanguage)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={pendingDraftDelete !== null} onOpenChange={open => { if (!open) setPendingDraftDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drafts.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('drafts.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { if (pendingDraftDelete) void onDeleteDraft(pendingDraftDelete) }}
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => { if (!open) setPendingDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={() => setPendingDelete(null)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async () => {
                if (!pendingDelete) return
                setDeleting(true)
                setDeleteError(null)
                try {
                  await onDelete(pendingDelete.id, pendingDelete.version)
                  setPendingDelete(null)
                } catch (error) {
                  setDeleteError(error instanceof SavedCharacterApiError
                    ? error
                    : new SavedCharacterApiError('unavailable'))
                } finally {
                  setDeleting(false)
                }
              }}
              variant="destructive"
            >
              {deleting ? t('saving') : t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
