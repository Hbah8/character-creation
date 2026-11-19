import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import type { WorldApiErrorCode } from '@/world/services/worldApi'
import type { SavedWorldRecord } from '@/world/services/worldApi'
import type { World } from '@/world/types'

interface Props {
  onReloadWorld?: (world: World) => void
  onOverwrite?: (version: number) => Promise<SavedWorldRecord | null>
}

export function WorldSyncNotice({ onReloadWorld, onOverwrite }: Props) {
  const { t } = useTranslation('library')
  const { t: tCommon } = useTranslation('common')
  const library = useWorldLibrary()
  const [conflictOpen, setConflictOpen] = useState(false)
  const [overwriteTarget, setOverwriteTarget] = useState<{ version: number; updatedAt: string } | null>(null)
  const [checkingOverwrite, setCheckingOverwrite] = useState(false)
  const { error, retrySave, retryCreate, retryDelete, reload, reloadWorld: loadWorld, getOverwriteTarget } = library
  const worldId = error?.worldId
  const prepareOverwrite = useCallback(async () => {
    if (!worldId || checkingOverwrite) return
    setCheckingOverwrite(true)
    try {
      setOverwriteTarget(await getOverwriteTarget(worldId))
    } catch {
      setOverwriteTarget(null)
    } finally {
      setCheckingOverwrite(false)
    }
  }, [checkingOverwrite, getOverwriteTarget, worldId])
  const reloadSelected = useCallback(async () => {
    if (!worldId) return
    try {
      const world = await loadWorld(worldId)
      onReloadWorld?.(world)
    } catch {
      // The store exposes the load error.
    }
  }, [loadWorld, onReloadWorld, worldId])

  useEffect(() => {
    const toastId = 'world-sync-error'
    if (!error) {
      toast.dismiss(toastId)
      return
    }
    const key: `worlds.errors.${WorldApiErrorCode}` = `worlds.errors.${error.code}`
    const message = error.operation === 'delete' && error.code === 'unavailable'
      ? t('worlds.deleteUnavailable')
      : t(key)
    const id = error.worldId
    const conflict = error.operation === 'save' && error.code === 'conflict' && id
    toast.error(tCommon('error'), {
      id: toastId,
      description: message,
      duration: Infinity,
      action: conflict
        ? {
            label: t('worlds.resolveConflict'),
            onClick: event => {
              event.preventDefault()
              setConflictOpen(true)
            },
          }
        : error.code !== 'referencedResource' ? {
            label: t('worlds.retry'),
            onClick: event => {
              event.preventDefault()
              if (!id && error.operation === 'save') void retryCreate()
              else if (!id) void reload()
              else if (error.operation === 'delete') void retryDelete(id)
              else if (error.operation === 'save') void retrySave(id)
              else void reloadSelected()
            },
          } : undefined,
    })
    return () => { toast.dismiss(toastId) }
  }, [error, reload, reloadSelected, retryCreate, retryDelete, retrySave, t, tCommon])

  async function confirmOverwrite() {
    if (!worldId || !overwriteTarget) return
    if (onOverwrite) {
      await onOverwrite(overwriteTarget.version)
    } else {
      await library.retrySave(worldId, overwriteTarget.version)
    }
    setOverwriteTarget(null)
  }

  return (
    <>
      <AlertDialog open={conflictOpen && error?.code === 'conflict' && error.operation === 'save'} onOpenChange={setConflictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('worlds.resolveConflict')}</AlertDialogTitle>
            <AlertDialogDescription>{t('worlds.errors.conflict')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="outline" onClick={() => void reloadSelected()}>
              {t('worlds.reloadLatest')}
            </AlertDialogAction>
            <AlertDialogAction disabled={checkingOverwrite} onClick={() => void prepareOverwrite()}>
              {checkingOverwrite ? t('worlds.checkingVersion') : t('worlds.overwriteLatest')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={overwriteTarget !== null} onOpenChange={open => {
        if (!open) setOverwriteTarget(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('worlds.overwriteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {overwriteTarget && t('worlds.overwriteDescription', {
                version: overwriteTarget.version,
                time: new Date(overwriteTarget.updatedAt).toLocaleString(),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmOverwrite()}>
              {t('worlds.confirmOverwrite')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
