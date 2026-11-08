import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RaceForm } from '@/racebuilder/components/RaceForm'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { World } from '@/world/types'

export function RaceBuilderPage() {
  const { t } = useTranslation('raceBuilder')
  const { t: tLibrary } = useTranslation('library')
  const navigate = useNavigate()
  const { raceId } = useParams<{ raceId?: string }>()
  const { entries, activeWorldId, saveById, loading } = useWorldLibrary()

  const activeEntry = activeWorldId
    ? entries.find(entry => entry.id === activeWorldId) ?? null
    : null
  const activeWorld = activeEntry?.world ?? null
  const raceForEdit = raceId
    ? activeWorld?.races.find(race => race.id === raceId) ?? null
    : null

  if (loading) {
    return <main className="p-6" role="status">{tLibrary('loadingWorlds')}</main>
  }

  if (!activeWorldId || !activeWorld) {
    return <Navigate to="/" replace />
  }

  if (raceId && !raceForEdit) {
    return <Navigate to="/races" replace />
  }

  function saveWorld(nextWorld: World) {
    if (!activeWorldId) return
    saveById(activeWorldId, nextWorld)
    navigate('/races')
  }

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

        {raceForEdit ? (
          <RaceForm
            mode="edit"
            race={raceForEdit}
            worldId={activeWorldId}
            world={activeWorld}
            onSaved={saveWorld}
            onCancel={() => navigate('/races')}
          />
        ) : (
          <RaceForm
            mode="create"
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
