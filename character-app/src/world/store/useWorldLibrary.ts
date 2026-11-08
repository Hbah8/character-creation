import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react'
import type { World } from '@/world/types'
import { SessionAccountContext } from '@/accounts/useSessionAccount'
import { worldLibraryStore } from '@/world/store/worldLibraryStore'

export function useWorldLibrary() {
  const account = useContext(SessionAccountContext)
  const accountId = account?.id ?? ''
  const snapshot = useSyncExternalStore(
    worldLibraryStore.subscribe,
    () => worldLibraryStore.getSnapshot(accountId),
    () => worldLibraryStore.getSnapshot(accountId),
  )

  useEffect(() => {
    if (!accountId) return
    void worldLibraryStore.load(accountId)
  }, [accountId])

  const save = useCallback((world: World): Promise<string> => {
    return worldLibraryStore.save(accountId, world)
  }, [accountId])

  const loadById = useCallback((id: string): Promise<World> => {
    return worldLibraryStore.loadById(accountId, id)
  }, [accountId])

  const remove = useCallback((id: string): Promise<void> => {
    return worldLibraryStore.remove(accountId, id)
  }, [accountId])

  const saveById = useCallback((id: string, world: World): Promise<void> => {
    return worldLibraryStore.saveById(accountId, id, world)
  }, [accountId])

  const reload = useCallback((): Promise<void> => {
    return worldLibraryStore.load(accountId, true)
  }, [accountId])

  const reloadWorld = useCallback((id: string): Promise<World> => {
    return worldLibraryStore.reloadWorld(accountId, id)
  }, [accountId])

  const retrySave = useCallback((id: string, overwrite = false): Promise<void> => {
    return worldLibraryStore.retrySave(accountId, id, overwrite)
  }, [accountId])

  const retryDelete = useCallback((id: string): Promise<void> => {
    return worldLibraryStore.retryDelete(accountId, id)
  }, [accountId])

  const retryCreate = useCallback((): Promise<void> => {
    return worldLibraryStore.retryCreate(accountId)
  }, [accountId])

  const markNew = useCallback((): void => {
    worldLibraryStore.setCurrentId(accountId, null)
  }, [accountId])

  const setActiveWorldId = useCallback((id: string | null): void => {
    worldLibraryStore.setActiveWorldId(accountId, id)
  }, [accountId])

  return {
    ...snapshot,
    save,
    saveById,
    loadById,
    remove,
    markNew,
    setActiveWorldId,
    reload,
    reloadWorld,
    retrySave,
    retryDelete,
    retryCreate,
  }
}
