import { DraftStorageError, sanitizeEntityDraftData } from '@/services/entityDraftStore'
import type { Character } from '@/types/character'

export interface CharacterDraft {
  formatVersion: 1
  accountId: string
  draftId: string
  entityId: string
  isNew: boolean
  baseVersion: number | null
  baseUpdatedAt: string | null
  modifiedAt: string
  revision: number
  character: Character
}

interface WriteCharacterDraft {
  accountId: string
  draftId: string
  entityId: string
  isNew: boolean
  baseVersion: number | null
  baseUpdatedAt: string | null
  expectedRevision: number | null
  character: Character
}

const DATABASE_NAME = 'swade-character-drafts'
const STORE_NAME = 'drafts'
export const CHARACTER_DRAFTS_CHANGED = 'swade-character-drafts-changed'

function notifyDraftsChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHARACTER_DRAFTS_CHANGED))
}

function storageError(error: unknown): DraftStorageError {
  if (error instanceof DraftStorageError) return error
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new DraftStorageError('quotaExceeded')
  }
  if (error instanceof DOMException && error.name === 'DataCloneError') {
    return new DraftStorageError('invalidData')
  }
  return new DraftStorageError('unavailable')
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DATABASE_NAME, 1)
    } catch (error) {
      reject(storageError(error))
      return
    }
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: ['accountId', 'draftId'] })
      store.createIndex('accountId', 'accountId')
    }
    request.onerror = () => reject(storageError(request.error))
    request.onblocked = () => reject(new DraftStorageError('unavailable'))
    request.onsuccess = () => resolve(request.result)
  })
}

function transaction<T>(
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore,
    result: (value: T) => void,
    fail: (error: DraftStorageError) => void,
  ) => void,
): Promise<T> {
  return openDatabase().then(database => new Promise<T>((resolve, reject) => {
    let value: T
    let failure: DraftStorageError | null = null
    const tx = database.transaction(STORE_NAME, mode)
    tx.oncomplete = () => {
      database.close()
      resolve(value)
    }
    tx.onabort = () => {
      database.close()
      reject(failure ?? storageError(tx.error))
    }
    try {
      operation(tx.objectStore(STORE_NAME), result => { value = result }, error => {
        failure = error
        tx.abort()
      })
    } catch (error) {
      tx.abort()
      database.close()
      reject(storageError(error))
    }
  }))
}

function isCharacterDraft(value: unknown): value is CharacterDraft {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const draft = value as Record<string, unknown>
  const character = draft.character
  return draft.formatVersion === 1
    && typeof draft.accountId === 'string' && draft.accountId.length > 0
    && typeof draft.draftId === 'string' && draft.draftId.length > 0
    && typeof draft.entityId === 'string' && draft.entityId.length > 0
    && typeof draft.isNew === 'boolean'
    && (draft.baseVersion === null
      || typeof draft.baseVersion === 'number' && Number.isSafeInteger(draft.baseVersion) && draft.baseVersion > 0)
    && (draft.baseUpdatedAt === null || typeof draft.baseUpdatedAt === 'string')
    && typeof draft.modifiedAt === 'string' && Number.isFinite(Date.parse(draft.modifiedAt))
    && typeof draft.revision === 'number' && Number.isSafeInteger(draft.revision) && draft.revision > 0
    && character !== null && typeof character === 'object' && !Array.isArray(character)
    && 'callsign' in character && typeof character.callsign === 'string'
    && 'name' in character && typeof character.name === 'string'
    && (!('worldId' in character) || character.worldId === undefined || typeof character.worldId === 'string')
}

export function listCharacterDrafts(accountId: string): Promise<{ drafts: CharacterDraft[]; corrupt: boolean }> {
  return transaction('readonly', (store, result) => {
    const request = store.index('accountId').getAll(accountId)
    request.onsuccess = () => {
      const records: unknown[] = request.result
      const drafts = records.filter(isCharacterDraft)
      result({
        drafts: drafts.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt)),
        corrupt: drafts.length !== records.length,
      })
    }
  })
}

export function writeCharacterDraft(input: WriteCharacterDraft): Promise<CharacterDraft> {
  return transaction<CharacterDraft>('readwrite', (store, result, fail) => {
    const request = store.get([input.accountId, input.draftId])
    request.onsuccess = () => {
      const existing: unknown = request.result
      if (existing !== undefined && !isCharacterDraft(existing)) {
        fail(new DraftStorageError('corrupt'))
        return
      }
      const canUpdate = existing !== undefined
        && existing.entityId === input.entityId
        && existing.revision === input.expectedRevision
      const draft: CharacterDraft = {
        formatVersion: 1,
        accountId: input.accountId,
        draftId: existing === undefined && input.expectedRevision === null
          ? input.draftId
          : canUpdate ? input.draftId : crypto.randomUUID(),
        entityId: input.entityId,
        isNew: input.isNew,
        baseVersion: input.baseVersion,
        baseUpdatedAt: input.baseUpdatedAt,
        modifiedAt: new Date().toISOString(),
        revision: canUpdate ? existing.revision + 1 : 1,
        character: sanitizeEntityDraftData(input.character),
      }
      store.put(draft)
      result(draft)
    }
  }).then(draft => {
    notifyDraftsChanged()
    return draft
  })
}

export function deleteCharacterDraft(draft: CharacterDraft): Promise<boolean> {
  return transaction<boolean>('readwrite', (store, result, fail) => {
    const request = store.get([draft.accountId, draft.draftId])
    request.onsuccess = () => {
      const existing: unknown = request.result
      if (existing !== undefined && !isCharacterDraft(existing)) {
        fail(new DraftStorageError('corrupt'))
        return
      }
      const matches = existing !== undefined && existing.revision === draft.revision
      if (matches) store.delete([draft.accountId, draft.draftId])
      result(matches)
    }
  }).then(deleted => {
    if (deleted) notifyDraftsChanged()
    return deleted
  })
}

export function confirmCharacterDraft(
  sent: CharacterDraft,
  saved: { id: string; version: number; updatedAt: string },
): Promise<void> {
  return transaction('readwrite', (store, result, fail) => {
    const request = store.get([sent.accountId, sent.draftId])
    request.onsuccess = () => {
      const existing: unknown = request.result
      if (existing !== undefined && !isCharacterDraft(existing)) {
        fail(new DraftStorageError('corrupt'))
        return
      }
      if (existing && existing.revision === sent.revision) {
        store.delete([sent.accountId, sent.draftId])
      } else if (existing && existing.revision > sent.revision) {
        store.put({
          ...existing,
          entityId: saved.id,
          isNew: false,
          baseVersion: saved.version,
          baseUpdatedAt: saved.updatedAt,
        })
      }
      result(undefined)
    }
  }).then(() => { notifyDraftsChanged() })
}
