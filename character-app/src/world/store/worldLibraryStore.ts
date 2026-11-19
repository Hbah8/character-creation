import { WorldApiError, worldApi } from '@/world/services/worldApi'
import type { SavedWorldRecord } from '@/world/services/worldApi'
import type { World } from '@/world/types'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'

export interface WorldLibrarySnapshot {
  accountId: string | null
  entries: WorldLibraryEntry[]
  loading: boolean
  error: WorldSyncError | null
  currentId: string | null
  activeWorldId: string | null
}

export interface WorldSyncError {
  code: WorldApiError['code']
  operation: 'load' | 'save' | 'delete'
  worldId?: string
}

const EMPTY_SNAPSHOT: WorldLibrarySnapshot = {
  accountId: null,
  entries: [],
  loading: true,
  error: null,
  currentId: null,
  activeWorldId: null,
}

function toEntry(record: SavedWorldRecord): WorldLibraryEntry {
  return {
    id: record.id,
    savedAt: record.updatedAt,
    version: record.version,
    world: record.world,
  }
}

function toSyncError(
  error: unknown,
  worldId?: string,
  operation: WorldSyncError['operation'] = 'load',
): WorldSyncError {
  return {
    code: error instanceof WorldApiError ? error.code : 'unavailable',
    operation,
    ...(worldId === undefined ? {} : { worldId }),
  }
}

export class WorldLibraryStore {
  private snapshot: WorldLibrarySnapshot = EMPTY_SNAPSHOT
  private sequence = 0
  private selectionSequence = 0
  private readonly listeners = new Set<() => void>()
  private readonly drafts = new Map<string, World>()
  private readonly saves = new Map<string, Promise<void>>()
  private createDraft: { accountId: string; id: string; world: World } | null = null

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(accountId: string): WorldLibrarySnapshot {
    return this.snapshot.accountId === accountId ? this.snapshot : EMPTY_SNAPSHOT
  }

  async load(accountId: string, force = false): Promise<void> {
    if (this.snapshot.accountId !== accountId) {
      this.sequence += 1
      this.selectionSequence += 1
      this.drafts.clear()
      this.saves.clear()
      this.createDraft = null
      this.setSnapshot({
        accountId,
        entries: [],
        loading: true,
        error: null,
        currentId: null,
        activeWorldId: null,
      })
    } else if (this.snapshot.loading) {
      return
    } else if (!force) {
      return
    } else {
      this.setSnapshot({ ...this.snapshot, loading: true, error: null })
    }

    const request = ++this.sequence
    try {
      const records = await worldApi.list()
      if (request !== this.sequence || this.snapshot.accountId !== accountId) return
      this.setSnapshot({
        ...this.snapshot,
        entries: records.map(toEntry),
        loading: false,
        error: null,
        activeWorldId: this.snapshot.activeWorldId
          && records.some(record => record.id === this.snapshot.activeWorldId)
          ? this.snapshot.activeWorldId
          : null,
      })
    } catch (error) {
      if (request !== this.sequence || this.snapshot.accountId !== accountId) return
      this.setSnapshot({ ...this.snapshot, entries: [], loading: false, error: toSyncError(error) })
    }
  }

  async save(
    accountId: string,
    id: string | null,
    createId: string,
    world: World,
  ): Promise<SavedWorldRecord> {
    if (id) {
      await this.saveById(accountId, id, world)
      const error = this.getSnapshot(accountId).error
      if (error?.worldId === id) throw new WorldApiError(error.code)
      const entry = this.getSnapshot(accountId).entries.find(item => item.id === id)
      if (!entry || entry.version === undefined) throw new WorldApiError('notFound')
      return {
        id: entry.id,
        version: entry.version,
        createdAt: entry.savedAt,
        updatedAt: entry.savedAt,
        world: entry.world,
      }
    }
    this.createDraft = { accountId, id: createId, world }
    return this.createNew(accountId, createId, world)
  }

  async retryCreate(accountId: string): Promise<void> {
    if (this.createDraft?.accountId !== accountId) return
    try {
      await this.createNew(accountId, this.createDraft.id, this.createDraft.world)
    } catch {
      // The stable create ID and draft remain available for another retry.
    }
  }

  private async createNew(accountId: string, id: string, world: World): Promise<SavedWorldRecord> {
    try {
      const record = await worldApi.create(world, id)
      if (this.snapshot.accountId === accountId) {
        this.createDraft = null
        this.setSnapshot({
          ...this.snapshot,
          entries: [toEntry(record), ...this.snapshot.entries.filter(entry => entry.id !== record.id)],
          currentId: record.id,
          error: null,
        })
      }
      return record
    } catch (error) {
      if (this.snapshot.accountId === accountId) {
        this.setSnapshot({ ...this.snapshot, error: toSyncError(error, undefined, 'save') })
      }
      throw error
    }
  }

  async saveById(accountId: string, id: string, world: World): Promise<void> {
    if (this.snapshot.accountId !== accountId) return
    if (!this.snapshot.entries.some(entry => entry.id === id)) {
      this.setSnapshot({
        ...this.snapshot,
        error: { code: 'notFound', operation: 'save', worldId: id },
      })
      return
    }
    this.drafts.set(id, world)
    this.setSnapshot({ ...this.snapshot, error: null })
    await this.flush(accountId, id)
  }

  async remove(accountId: string, id: string): Promise<void> {
    const entry = this.getSnapshot(accountId).entries.find(item => item.id === id)
    if (!entry || entry.version === undefined) {
      this.setError(accountId, 'notFound', id, 'delete')
      return
    }
    try {
      await worldApi.delete(id, entry.version)
      if (this.snapshot.accountId !== accountId) return
      this.setSnapshot({
        ...this.snapshot,
        entries: this.snapshot.entries.filter(item => item.id !== id),
        currentId: this.snapshot.currentId === id ? null : this.snapshot.currentId,
        activeWorldId: this.snapshot.activeWorldId === id ? null : this.snapshot.activeWorldId,
        error: null,
      })
    } catch (error) {
      this.setError(accountId, error, id, 'delete')
    }
  }

  async loadById(accountId: string, id: string): Promise<World> {
    if (this.snapshot.accountId !== accountId || this.snapshot.loading) {
      await this.load(accountId)
    }
    const selection = ++this.selectionSequence
    let entry = this.getSnapshot(accountId).entries.find(item => item.id === id)
    if (!entry) {
      try {
        const record = await worldApi.get(id)
        if (this.snapshot.accountId === accountId) {
          entry = toEntry(record)
          this.setSnapshot({
            ...this.snapshot,
            entries: [entry, ...this.snapshot.entries.filter(item => item.id !== id)],
          })
        } else {
          return record.world
        }
      } catch (error) {
        this.setError(accountId, error, id, 'load')
        throw error
      }
    }
    if (this.snapshot.accountId === accountId && selection === this.selectionSequence) {
      this.setSnapshot({ ...this.snapshot, currentId: id })
    }
    return entry.world
  }

  async reloadWorld(accountId: string, id: string): Promise<World> {
    try {
      const record = await worldApi.get(id)
      if (this.snapshot.accountId === accountId) {
        this.setSnapshot({
          ...this.snapshot,
          entries: [toEntry(record), ...this.snapshot.entries.filter(entry => entry.id !== id)],
          error: null,
        })
      }
      return record.world
    } catch (error) {
      this.setError(accountId, error, id, 'load')
      throw error
    }
  }

  async getOverwriteTarget(accountId: string, id: string): Promise<{ version: number; updatedAt: string }> {
    try {
      const latest = await worldApi.get(id)
      if (this.snapshot.accountId !== accountId) throw new WorldApiError('unauthenticated')
      return { version: latest.version, updatedAt: latest.updatedAt }
    } catch (error) {
      this.setError(accountId, error, id, 'save')
      throw error
    }
  }

  async retrySave(
    accountId: string,
    id: string,
    overwriteVersion?: number,
    submittedWorld?: World,
  ): Promise<SavedWorldRecord | null> {
    const entry = this.getSnapshot(accountId).entries.find(item => item.id === id)
    if (!entry) {
      this.setError(accountId, 'notFound', id, 'save')
      return null
    }
    const world = submittedWorld ?? this.drafts.get(id) ?? entry.world
    this.drafts.set(id, world)
    const version = overwriteVersion ?? entry.version
    try {
      if (version === undefined) throw new WorldApiError('invalidResponse')
      const saved = await worldApi.update(id, version, world)
      if (this.snapshot.accountId === accountId) {
        if (this.drafts.get(id) === world) this.drafts.delete(id)
        this.setSnapshot({
          ...this.snapshot,
          entries: [toEntry(saved), ...this.snapshot.entries.filter(item => item.id !== id)],
          error: null,
        })
      }
      return saved
    } catch (error) {
      this.setError(accountId, error, id, 'save')
      return null
    }
  }

  async retryDelete(accountId: string, id: string): Promise<void> {
    const entry = this.getSnapshot(accountId).entries.find(item => item.id === id)
    if (!entry || entry.version === undefined) {
      this.setError(accountId, 'notFound', id, 'delete')
      return
    }
    try {
      await worldApi.delete(id, entry.version)
      if (this.snapshot.accountId !== accountId) return
      this.setSnapshot({
        ...this.snapshot,
        entries: this.snapshot.entries.filter(item => item.id !== id),
        activeWorldId: this.snapshot.activeWorldId === id ? null : this.snapshot.activeWorldId,
        currentId: this.snapshot.currentId === id ? null : this.snapshot.currentId,
        error: null,
      })
    } catch (error) {
      this.setError(accountId, error, id, 'delete')
    }
  }

  setCurrentId(accountId: string, id: string | null): void {
    if (this.snapshot.accountId === accountId) {
      if (id === null && this.createDraft?.accountId === accountId) this.createDraft = null
      this.setSnapshot({ ...this.snapshot, currentId: id })
    }
  }

  setActiveWorldId(accountId: string, id: string | null): void {
    if (this.snapshot.accountId === accountId) {
      this.setSnapshot({ ...this.snapshot, activeWorldId: id })
    }
  }

  private async flush(accountId: string, id: string): Promise<void> {
    const existing = this.saves.get(id)
    if (existing) {
      await existing
      return
    }
    const task = this.flushDrafts(accountId, id)
    this.saves.set(id, task)
    try {
      await task
    } finally {
      if (this.saves.get(id) === task) this.saves.delete(id)
    }
  }

  private async flushDrafts(accountId: string, id: string): Promise<void> {
    let inFlightWorld: World | null = null
    try {
      while (this.drafts.has(id) && this.snapshot.accountId === accountId) {
        const world = this.drafts.get(id)!
        this.drafts.delete(id)
        inFlightWorld = world
        const entry = this.snapshot.entries.find(item => item.id === id)
        if (!entry || entry.version === undefined) throw new WorldApiError('notFound')
        const saved = await worldApi.update(id, entry.version, world)
        if (this.snapshot.accountId !== accountId) return
        this.setSnapshot({
          ...this.snapshot,
          entries: [toEntry(saved), ...this.snapshot.entries.filter(item => item.id !== id)],
          error: null,
        })
      }
    } catch (error) {
      if (this.snapshot.accountId === accountId) {
        if (inFlightWorld && !this.drafts.has(id)) this.drafts.set(id, inFlightWorld)
        this.setSnapshot({ ...this.snapshot, error: toSyncError(error, id, 'save') })
      }
    }
  }

  private setError(
    accountId: string,
    error: unknown,
    id?: string,
    operation: WorldSyncError['operation'] = 'load',
  ): void {
    if (this.snapshot.accountId === accountId) {
      this.setSnapshot({ ...this.snapshot, error: toSyncError(error, id, operation) })
    }
  }

  private setSnapshot(snapshot: WorldLibrarySnapshot): void {
    this.snapshot = snapshot
    this.listeners.forEach(listener => listener())
  }
}

export const worldLibraryStore = new WorldLibraryStore()
