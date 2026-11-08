import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { WorldApiErrorCode } from '@/world/services/worldApi'
import type { World } from '@/world/types'

interface Props {
  onReloadWorld?: (world: World) => void
}

export function WorldSyncNotice({ onReloadWorld }: Props) {
  const { t } = useTranslation('library')
  const library = useWorldLibrary()
  const error = library.error
  if (!error) return null

  const worldErrorKey: `worlds.errors.${WorldApiErrorCode}` = `worlds.errors.${error.code}`
  const worldId = error.worldId

  async function reloadWorld() {
    if (!worldId) return
    try {
      const world = await library.reloadWorld(worldId)
      onReloadWorld?.(world)
    } catch {
      // The store retains the load error for this notice.
    }
  }

  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-col gap-3">
        <p>{t(worldErrorKey)}</p>
        <div className="flex flex-wrap gap-2">
          {error.operation === 'save' && error.code === 'conflict' && worldId ? (
            <>
              <Button size="sm" onClick={() => void library.retrySave(worldId, true)}>
                {t('worlds.overwriteLatest')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void reloadWorld()}>
                {t('worlds.reloadLatest')}
              </Button>
            </>
          ) : error.code !== 'referencedResource' && (
            <Button
              size="sm"
              onClick={() => {
                if (!worldId && error.operation === 'save') {
                  void library.retryCreate()
                } else if (!worldId) {
                  void library.reload()
                } else if (error.operation === 'delete') {
                  void library.retryDelete(worldId)
                } else if (error.operation === 'save') {
                  void library.retrySave(worldId)
                } else {
                  void reloadWorld()
                }
              }}
            >
              {t('worlds.retry')}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
