import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, FolderOpen, MoreHorizontal, Shield, Swords } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

export function DashboardCharacterGrid({ entries, onDelete }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation('library')
  const { i18n } = useTranslation()
  const [pendingDelete, setPendingDelete] = useState<SavedCharacterRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<SavedCharacterApiError | null>(null)

  if (entries.length === 0) {
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
        {entries.map(entry => {
          const char = entry.character
          const subtitle = [char.role, char.rank].filter(Boolean).join(' · ')

          return (
            <Card
              key={entry.id}
              className="flex flex-col overflow-hidden cursor-pointer transition-colors hover:bg-accent/40"
              onClick={() => navigate(`/creator/${entry.id}`)}
            >
              <div className="h-32 bg-muted overflow-hidden shrink-0">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground/40 select-none">
                    {(char.callsign || '?')[0].toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Info */}
              <CardContent className="flex flex-col gap-1.5 p-3 flex-1">
                {/* Name row + menu */}
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight truncate">
                      {char.callsign || '—'}
                    </p>
                    {subtitle && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0 -mr-1 -mt-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/creator/${entry.id}`)}>
                        <FolderOpen className="size-4 mr-2" />
                        {t('open')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete(entry)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quick combat stats */}
                {(char.parry || char.toughness) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {char.parry && (
                      <span className="flex items-center gap-0.5">
                        <Swords className="size-3 shrink-0" />
                        {char.parry}
                      </span>
                    )}
                    {char.toughness && (
                      <span className="flex items-center gap-0.5">
                        <Shield className="size-3 shrink-0" />
                        {char.toughness}
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground/60 mt-auto pt-1">
                  {new Date(entry.updatedAt).toLocaleDateString(i18n.resolvedLanguage)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{t(`errors.${deleteError.code}`)}</AlertDescription>
            </Alert>
          )}
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