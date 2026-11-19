export type DraftEntityType = 'character' | 'world'

export interface EntityDraft<T = unknown> {
  formatVersion: 1
  accountId: string
  entityType: DraftEntityType
  entityId: string
  isNew: boolean
  instanceId: string
  baseVersion: number | null
  baseUpdatedAt: string | null
  modifiedAt: string
  revision: number
  basedOn?: {
    instanceId: string
    revision: number
  }
  data: T
}

export interface DraftStorage {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type DraftStorageErrorCode = 'unavailable' | 'quotaExceeded' | 'corrupt' | 'invalidData'

export class DraftStorageError extends Error {
  constructor(public readonly code: DraftStorageErrorCode) {
    super(code)
  }
}

const STORAGE_PREFIX = 'swade-entity-draft-v1:'
const SENSITIVE_KEY = /(token|password|secret|credential)/i

function resolveStorage(storage?: DraftStorage): DraftStorage {
  if (storage) return storage
  try {
    return globalThis.localStorage
  } catch {
    throw new DraftStorageError('unavailable')
  }
}

function isDraft(value: unknown): value is EntityDraft {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const draft = value as Record<string, unknown>
  return draft.formatVersion === 1
    && typeof draft.accountId === 'string'
    && (draft.entityType === 'character' || draft.entityType === 'world')
    && typeof draft.entityId === 'string'
    && typeof draft.isNew === 'boolean'
    && typeof draft.instanceId === 'string'
    && (draft.baseVersion === null || typeof draft.baseVersion === 'number')
    && (draft.baseUpdatedAt === null || typeof draft.baseUpdatedAt === 'string')
    && typeof draft.modifiedAt === 'string'
    && Number.isSafeInteger(draft.revision)
    && (draft.revision as number) > 0
    && draft.data !== null
    && typeof draft.data === 'object'
}

function storageKey(draft: Pick<EntityDraft, 'accountId' | 'entityType' | 'entityId' | 'instanceId'>): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(draft.accountId)}:${draft.entityType}:`
    + `${encodeURIComponent(draft.entityId)}:${encodeURIComponent(draft.instanceId)}`
}

function readDraft(storage: DraftStorage, key: string): EntityDraft | null {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    throw new DraftStorageError('unavailable')
  }
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new DraftStorageError('corrupt')
  }
  if (!isDraft(parsed) || storageKey(parsed) !== key) throw new DraftStorageError('corrupt')
  return parsed
}

function sanitize(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return undefined
  if (typeof value === 'string') return value.startsWith('data:') ? '' : value
  if (Array.isArray(value)) return value.map(item => sanitize(item))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([childKey, child]) => {
        const sanitized = sanitize(child, childKey)
        return sanitized === undefined ? [] : [[childKey, sanitized]]
      }),
    )
  }
  return value
}

export function sanitizeEntityDraftData<T>(data: T): T {
  return sanitize(data) as T
}

function writeDraft(storage: DraftStorage, draft: EntityDraft): void {
  let serialized: string
  try {
    serialized = JSON.stringify(draft)
  } catch (error) {
    throw new DraftStorageError(error instanceof TypeError ? 'invalidData' : 'unavailable')
  }
  try {
    storage.setItem(storageKey(draft), serialized)
  } catch (error) {
    const name = error !== null && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''
    throw new DraftStorageError(name === 'QuotaExceededError' ? 'quotaExceeded' : 'unavailable')
  }
}

export function listEntityDrafts(
  storage: DraftStorage | undefined,
  accountId: string,
  entityType: DraftEntityType,
  entityId: string | null,
): EntityDraft[] {
  const target = resolveStorage(storage)
  const drafts: EntityDraft[] = []
  const accountPrefix = `${STORAGE_PREFIX}${encodeURIComponent(accountId)}:${entityType}:`
  const entityPrefix = entityId === null
    ? null
    : `${accountPrefix}${encodeURIComponent(entityId)}:`
  const draftPrefix = entityPrefix ?? accountPrefix
  try {
    for (let index = 0; index < target.length; index++) {
      const key = target.key(index)
      if (!key || !key.startsWith(draftPrefix)) continue
      const draft = readDraft(target, key)
      if (draft) drafts.push(draft)
    }
  } catch (error) {
    if (error instanceof DraftStorageError) throw error
    throw new DraftStorageError('unavailable')
  }
  return drafts.filter(draft => draft.accountId === accountId
    && draft.entityType === entityType
    && (entityId === null ? draft.isNew : draft.entityId === entityId))
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
}

export function saveEntityDraft<T>(
  storage: DraftStorage | undefined,
  input: Omit<EntityDraft<T>, 'formatVersion' | 'modifiedAt' | 'revision'>,
  now = new Date(),
): EntityDraft<T> {
  if (!input.accountId || !input.entityId || !input.instanceId) {
    throw new DraftStorageError('invalidData')
  }
  const target = resolveStorage(storage)
  const key = storageKey(input)
  const existing = readDraft(target, key)
  const draft: EntityDraft<T> = {
    ...input,
    formatVersion: 1,
    modifiedAt: now.toISOString(),
    revision: existing === null ? 1 : existing.revision + 1,
    data: sanitize(input.data) as T,
  }
  writeDraft(target, draft)
  return draft
}

export function deleteEntityDraft(
  storage: DraftStorage | undefined,
  draft: Pick<EntityDraft, 'accountId' | 'entityType' | 'entityId' | 'instanceId' | 'revision'>,
): boolean {
  const target = resolveStorage(storage)
  const key = storageKey(draft)
  const existing = readDraft(target, key)
  if (!existing || existing.revision !== draft.revision) return false
  try {
    target.removeItem(key)
  } catch {
    throw new DraftStorageError('unavailable')
  }
  return true
}
