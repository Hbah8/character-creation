import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCharacterLibrary } from '@/store/useCharacterLibrary'
import { removeRaceFromWorld } from '@/world/store/useWorldStore'
import type { Race, World } from '@/world/types'

interface DeleteRaceDialogProps {
  open: boolean
  race: Race | null
  world: World
  onOpenChange: (open: boolean) => void
  onDeleted: (nextWorld: World) => void
}

export function DeleteRaceDialog({
  open,
  race,
  world,
  onOpenChange,
  onDeleted,
}: DeleteRaceDialogProps) {
  const { t } = useTranslation('raceBuilder')
  const { entries } = useCharacterLibrary()

  const characterUsageCount = useMemo(() => {
    if (!race) return 0
    return entries.filter(entry => {
      // M4-26 will add raceId to Character; until then this stays at 0.
      const character = entry.character as typeof entry.character & { raceId?: string }
      return character.raceId === race.id
    }).length
  }, [entries, race])

  function handleDelete() {
    if (!race) return
    onDeleted(removeRaceFromWorld({ ...world, races: world.races ?? [] }, race.id))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('deleteDialog.title', { name: race?.name ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {t('deleteDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {characterUsageCount > 0 && (
          <p className="text-sm text-destructive">
            {t('deleteDialog.inUseWarning', { count: characterUsageCount })}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('deleteDialog.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            {t('deleteDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
