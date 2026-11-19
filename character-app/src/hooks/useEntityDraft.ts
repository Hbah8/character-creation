import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteEntityDraft,
  DraftStorageError,
  listEntityDrafts,
  saveEntityDraft,
  sanitizeEntityDraftData,
} from '@/services/entityDraftStore'
import type { DraftEntityType, EntityDraft } from '@/services/entityDraftStore'

interface UseEntityDraftOptions<T> {
  accountId: string
  entityType: DraftEntityType
  entityId: string | null
  baseVersion: number | null
  baseUpdatedAt: string | null
  data: T
  isDirty: boolean
  onRecover: (data: T) => void
}

export function useEntityDraft<T>({
  accountId,
  entityType,
  entityId: serverEntityId,
  baseVersion,
  baseUpdatedAt,
  data,
  isDirty,
  onRecover,
}: UseEntityDraftOptions<T>) {
  const [instanceId] = useState(() => crypto.randomUUID())
  const [generatedEntityId, setGeneratedEntityId] = useState(() => crypto.randomUUID())
  const [recoveredEntityId, setRecoveredEntityId] = useState<string | null>(null)
  const activeEntityId = serverEntityId ?? recoveredEntityId ?? generatedEntityId
  const dataRef = useRef(data)
  const isDirtyRef = useRef(isDirty)
  const identityRef = useRef({ accountId, entityType, entityId: activeEntityId })
  const baseRef = useRef({ baseVersion, baseUpdatedAt })
  const basedOnRef = useRef<EntityDraft['basedOn']>(undefined)
  const recoverRef = useRef(onRecover)
  const flushRef = useRef<() => EntityDraft | null>(() => null)
  const [drafts, setDrafts] = useState<EntityDraft<T>[]>([])
  const [storageError, setStorageError] = useState<DraftStorageError['code'] | null>(null)

  const refreshDrafts = useCallback(() => {
    try {
      const allDrafts = listEntityDrafts(
        undefined,
        accountId,
        entityType,
        serverEntityId,
      )
      const branchedFrom = new Set(allDrafts.flatMap(draft =>
        draft.basedOn ? [draft.basedOn.instanceId] : []))
      setDrafts(allDrafts.filter(draft => (draft.instanceId !== instanceId || !isDirtyRef.current)
        && !branchedFrom.has(draft.instanceId)) as EntityDraft<T>[])
      setStorageError(null)
    } catch (error) {
      setDrafts([])
      setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
    }
  }, [accountId, entityType, instanceId, serverEntityId])

  const persistCurrent = useCallback((dataOverride?: T): EntityDraft | null => {
    if (!isDirtyRef.current) return null
    const identity = identityRef.current
    const base = baseRef.current
    try {
      const draft = saveEntityDraft(undefined, {
        accountId: identity.accountId,
        entityType: identity.entityType,
        entityId: identity.entityId,
        isNew: serverEntityId === null,
        instanceId,
        baseVersion: base.baseVersion,
        baseUpdatedAt: base.baseUpdatedAt,
        ...(basedOnRef.current ? { basedOn: basedOnRef.current } : {}),
        data: dataOverride ?? dataRef.current,
      })
      setStorageError(null)
      return draft
    } catch (error) {
      setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
      return null
    }
  }, [instanceId, serverEntityId])

  const restoreDraft = useCallback((draft: EntityDraft<T>) => {
    if (draft.accountId !== accountId || draft.entityType !== entityType) return
    if (serverEntityId !== null && draft.entityId !== serverEntityId) return
    if (draft.isNew) setRecoveredEntityId(draft.entityId)
    basedOnRef.current = { instanceId: draft.instanceId, revision: draft.revision }
    const targetId = serverEntityId ?? draft.entityId
    try {
      saveEntityDraft(undefined, {
        accountId,
        entityType,
        entityId: targetId,
        isNew: serverEntityId === null,
        instanceId,
        baseVersion: draft.baseVersion,
        baseUpdatedAt: draft.baseUpdatedAt,
        basedOn: { instanceId: draft.instanceId, revision: draft.revision },
        data: draft.data,
      })
      setStorageError(null)
      refreshDrafts()
    } catch (error) {
      setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
      return
    }
    recoverRef.current(draft.data)
  }, [accountId, entityType, instanceId, refreshDrafts, serverEntityId])

  const removeDraft = useCallback((draft: EntityDraft<T>) => {
    try {
      deleteEntityDraft(undefined, draft)
      refreshDrafts()
      setStorageError(null)
    } catch (error) {
      setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
    }
  }, [refreshDrafts])

  const confirmSaved = useCallback((
    sentDraft: EntityDraft | null,
    saved: { id: string; version: number; updatedAt: string },
  ) => {
    if (sentDraft === null) return
    const identity = identityRef.current
    if (identity.accountId !== sentDraft.accountId
      || identity.entityType !== sentDraft.entityType
      || identity.entityId !== sentDraft.entityId) return

    const latestData = sanitizeEntityDraftData(dataRef.current)
    if (JSON.stringify(latestData) === JSON.stringify(sentDraft.data)) {
      try {
        deleteEntityDraft(undefined, sentDraft)
        if (sentDraft.basedOn) {
          deleteEntityDraft(undefined, {
            accountId: sentDraft.accountId,
            entityType: sentDraft.entityType,
            entityId: sentDraft.entityId,
            instanceId: sentDraft.basedOn.instanceId,
            revision: sentDraft.basedOn.revision,
          })
        }
      } catch (error) {
        setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
      }
    } else {
      try {
        saveEntityDraft(undefined, {
          accountId: identity.accountId,
          entityType: identity.entityType,
          entityId: saved.id,
          isNew: false,
          instanceId,
          baseVersion: saved.version,
          baseUpdatedAt: saved.updatedAt,
          ...(basedOnRef.current ? { basedOn: basedOnRef.current } : {}),
          data: dataRef.current,
        })
      } catch (error) {
        setStorageError(error instanceof DraftStorageError ? error.code : 'unavailable')
      }
    }
    refreshDrafts()
  }, [instanceId, refreshDrafts])

  const startNewEntity = useCallback(() => {
    setGeneratedEntityId(crypto.randomUUID())
    setRecoveredEntityId(null)
    basedOnRef.current = undefined
  }, [])

  useEffect(() => {
    dataRef.current = data
    isDirtyRef.current = isDirty
    identityRef.current = { accountId, entityType, entityId: activeEntityId }
    baseRef.current = { baseVersion, baseUpdatedAt }
    recoverRef.current = onRecover
    flushRef.current = persistCurrent
  }, [accountId, activeEntityId, baseUpdatedAt, baseVersion, data, entityType, isDirty, onRecover, persistCurrent])

  useEffect(() => {
    refreshDrafts()
    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith('swade-entity-draft-v1:')) refreshDrafts()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [refreshDrafts])

  useEffect(() => {
    // This effect persists committed edits to browser storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isDirty) persistCurrent()
  }, [data, isDirty, persistCurrent])

  useEffect(() => {
    refreshDrafts()
  }, [isDirty, refreshDrafts])

  useEffect(() => {
    const handlePageHide = () => { flushRef.current() }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return {
    entityId: activeEntityId,
    drafts,
    storageError,
    persistCurrent,
    restoreDraft,
    removeDraft,
    confirmSaved,
    startNewEntity,
  }
}
