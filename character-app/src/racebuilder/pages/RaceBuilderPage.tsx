import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DeleteRaceDialog } from '@/racebuilder/components/DeleteRaceDialog'
import { RaceForm } from '@/racebuilder/components/RaceForm'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { Race, World } from '@/world/types'

interface RaceBuilderPageProps {
  mode?: 'list' | 'create' | 'edit'
}

export function RaceBuilderPage({ mode = 'list' }: RaceBuilderPageProps) {
  const { t } = useTranslation('raceBuilder')
  const navigate = useNavigate()
  const { raceId } = useParams<{ raceId?: string }>()
  const { entries, activeWorldId, saveById } = useWorldLibrary()
  const [raceToDelete, setRaceToDelete] = useState<Race | null>(null)

  const activeEntry = activeWorldId
    ? entries.find(entry => entry.id === activeWorldId) ?? null
    : null
  const activeWorld = activeEntry?.world ?? null
  const races = activeWorld?.races ?? []
  const raceForEdit = mode === 'edit'
    ? races.find(race => race.id === raceId) ?? null
    : null

  if (!activeWorldId || !activeWorld) {
    return <Navigate to="/" replace />
  }

  if (mode === 'edit' && !raceForEdit) {
    return <Navigate to="/races" replace />
  }

  function saveWorld(nextWorld: World) {
    if (!activeWorldId) return
    saveById(activeWorldId, nextWorld)
    navigate('/races')
  }

  function deleteRace(nextWorld: World) {
    if (!activeWorldId) return
    saveById(activeWorldId, nextWorld)
    setRaceToDelete(null)
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="h-full w-full min-h-0 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate('/races')}
              aria-label={t('actions.cancel')}
            >
              <ArrowLeftIcon />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {t('titleWithWorld', { world: activeWorld.name })}
              </h1>
            </div>
          </div>

          {mode === 'create' ? (
            <RaceForm
              mode="create"
              worldId={activeWorldId}
              world={activeWorld}
              onSaved={saveWorld}
              onCancel={() => navigate('/races')}
            />
          ) : (
            <RaceForm
              mode="edit"
              race={raceForEdit!}
              worldId={activeWorldId}
              world={activeWorld}
              onSaved={saveWorld}
              onCancel={() => navigate('/races')}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {t('titleWithWorld', { world: activeWorld.name })}
            </h1>
          </div>
          <Button onClick={() => navigate('/races/new')}>
            <PlusIcon data-icon="inline-start" />
            {t('actions.addRace')}
          </Button>
        </div>

        <Separator />

        {races.length === 0 ? (
          <div className="rounded-md border p-8 text-center">
            <h2 className="text-base font-semibold">{t('list.emptyTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('list.emptyDescription')}
            </p>
            <Button className="mt-4" onClick={() => navigate('/races/new')}>
              <PlusIcon data-icon="inline-start" />
              {t('actions.addRace')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {races.map(race => (
              <Card key={race.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="truncate">{race.name}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {t('list.abilityCount', { count: race.abilities.length })}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {race.description || t('list.noDescription')}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/races/${race.id}`)}
                  >
                    <PencilIcon data-icon="inline-start" />
                    {t('actions.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRaceToDelete(race)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    {t('actions.delete')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeleteRaceDialog
        open={raceToDelete !== null}
        race={raceToDelete}
        world={activeWorld}
        onOpenChange={open => {
          if (!open) setRaceToDelete(null)
        }}
        onDeleted={deleteRace}
      />
    </div>
  )
}
