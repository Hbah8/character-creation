import { useCallback, useEffect, useRef, useState } from 'react'
import {
  confirmCharacterDraft,
  deleteCharacterDraft,
  listCharacterDrafts,
  writeCharacterDraft,
} from '@/services/characterDraftRepository'
import type { CharacterDraft } from '@/services/characterDraftRepository'
import { DraftStorageError, sanitizeEntityDraftData } from '@/services/entityDraftStore'
import type { DraftStorageErrorCode } from '@/services/entityDraftStore'
import type { Character } from '@/types/character'

interface Options {
  accountId: string
  entityId: string | null
  selectedDraftId: string | null
  baseVersion: number | null
  baseUpdatedAt: string | null
  character: Character
  isDirty: boolean
  canRecover: boolean
  onRecover: (draft: CharacterDraft) => boolean
}

export function useCharacterDraft(options: Options) {
  const [generatedId] = useState(() => crypto.randomUUID())
  const [activeEntityId, setActiveEntityId] = useState(options.entityId ?? generatedId)
  const [draftId] = useState(() => crypto.randomUUID())
  const [recovered, setRecovered] = useState<CharacterDraft | null>(null)
  const [loading, setLoading] = useState(Boolean(options.selectedDraftId))
  const [error, setError] = useState<DraftStorageErrorCode | null>(null)
  const [missing, setMissing] = useState(false)
  const [restored, setRestored] = useState(false)
  const draftRef = useRef<CharacterDraft | null>(null)
  const sourceRef = useRef<CharacterDraft | null>(null)
  const saveAsNewIdRef = useRef<string | null>(null)
  const optionsRef = useRef(options)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const baseRef = useRef({ version: options.baseVersion, updatedAt: options.baseUpdatedAt })
  const entityIdRef = useRef(options.entityId ?? generatedId)

  useEffect(() => { optionsRef.current = options }, [options])
  useEffect(() => {
    if (!options.selectedDraftId) return
    let active = true
    void listCharacterDrafts(options.accountId).then(({ drafts, corrupt }) => {
      if (!active) return
      if (corrupt) setError('corrupt')
      const selected = drafts.find(draft => draft.draftId === options.selectedDraftId
        && (options.entityId === null ? draft.isNew : draft.entityId === options.entityId))
      if (!selected) {
        setMissing(true)
      } else {
        draftRef.current = selected
        entityIdRef.current = selected.entityId
        setActiveEntityId(selected.entityId)
        baseRef.current = { version: selected.baseVersion, updatedAt: selected.baseUpdatedAt }
        setRecovered(selected)
      }
      setLoading(false)
    }).catch(reason => {
      if (!active) return
      setError(reason instanceof DraftStorageError ? reason.code : 'unavailable')
      setLoading(false)
    })
    return () => { active = false }
  }, [options.accountId, options.entityId, options.selectedDraftId])

  useEffect(() => {
    if (!recovered || restored || !options.canRecover) return
    if (optionsRef.current.onRecover(recovered)) setRestored(true)
    else setError('corrupt')
  }, [options.canRecover, recovered, restored])

  useEffect(() => {
    if (!options.selectedDraftId && !draftRef.current) {
      baseRef.current = { version: options.baseVersion, updatedAt: options.baseUpdatedAt }
    }
  }, [options.baseUpdatedAt, options.baseVersion, options.selectedDraftId])

  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const result = queueRef.current.then(operation)
    queueRef.current = result.then(() => undefined, () => undefined)
    return result
  }, [])

  const persist = useCallback((character: Character): Promise<CharacterDraft | null> => {
    const snapshot = structuredClone(character)
    return enqueue(async () => {
      const current = draftRef.current
      if (current && current.entityId === entityIdRef.current
        && JSON.stringify(current.character) === JSON.stringify(sanitizeEntityDraftData(snapshot))) {
        return current
      }
      const draft = await writeCharacterDraft({
        accountId: options.accountId,
        draftId: current?.draftId ?? draftId,
        expectedRevision: current?.revision ?? null,
        entityId: entityIdRef.current,
        isNew: baseRef.current.version === null,
        baseVersion: baseRef.current.version,
        baseUpdatedAt: baseRef.current.updatedAt,
        character: snapshot,
      })
      draftRef.current = draft
      setError(null)
      return draft
    }).catch(reason => {
      setError(reason instanceof DraftStorageError ? reason.code : 'unavailable')
      return null
    })
  }, [draftId, enqueue, options.accountId])

  const ready = !options.selectedDraftId || restored
  useEffect(() => {
    if (ready && options.isDirty) void persist(options.character)
  }, [options.character, options.isDirty, persist, ready])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!optionsRef.current.isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  const confirmSaved = useCallback((
    sent: CharacterDraft | null,
    saved: { id: string; version: number; updatedAt: string },
  ): Promise<CharacterDraft | null> => enqueue(async () => {
    if (sent) await confirmCharacterDraft(sent, saved)
    if (sent && sourceRef.current) {
      await deleteCharacterDraft(sourceRef.current)
      sourceRef.current = null
    }
    saveAsNewIdRef.current = null
    const current = draftRef.current
    if (current && sent && current.draftId === sent.draftId) {
      draftRef.current = current.revision === sent.revision
        ? null
        : { ...current, entityId: saved.id, isNew: false, baseVersion: saved.version, baseUpdatedAt: saved.updatedAt }
    }
    entityIdRef.current = saved.id
    setActiveEntityId(saved.id)
    baseRef.current = { version: saved.version, updatedAt: saved.updatedAt }
    return draftRef.current
  }).catch(reason => {
    setError(reason instanceof DraftStorageError ? reason.code : 'unavailable')
    return draftRef.current
  }), [enqueue])

  const beginSaveAsNew = useCallback(() => enqueue(async () => {
    if (saveAsNewIdRef.current) return saveAsNewIdRef.current
    sourceRef.current = draftRef.current
    entityIdRef.current = crypto.randomUUID()
    saveAsNewIdRef.current = entityIdRef.current
    setActiveEntityId(entityIdRef.current)
    baseRef.current = { version: null, updatedAt: null }
    return entityIdRef.current
  }), [enqueue])

  return {
    entityId: activeEntityId,
    getBaseVersion: () => baseRef.current.version,
    recovered,
    loading,
    missing,
    ready,
    error,
    persist,
    confirmSaved,
    beginSaveAsNew,
  }
}
