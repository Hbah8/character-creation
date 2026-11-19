import { describe, expect, it, vi } from 'vitest'
import {
  deleteEntityDraft,
  listEntityDrafts,
  saveEntityDraft,
} from '@/services/entityDraftStore'

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const getItem = vi.fn((key: string) => values.get(key) ?? null)
  const setItem = vi.fn((key: string, value: string) => { values.set(key, value) })
  const removeItem = vi.fn((key: string) => { values.delete(key) })
  return {
    get length() { return values.size },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem,
    setItem,
    removeItem,
  }
}

describe('entity draft storage', () => {
  it('scopes drafts to account and entity and retains server base metadata', () => {
    const storage = createStorage()
    const input = {
      accountId: 'account-a',
      entityType: 'world' as const,
      entityId: 'world-1',
      isNew: false,
      instanceId: 'tab-a',
      baseVersion: 4,
      baseUpdatedAt: '2026-11-18T00:00:00.000Z',
      data: { name: 'Local edit' },
    }

    const saved = saveEntityDraft(storage, input, new Date('2026-11-18T01:00:00.000Z'))

    expect(saved).toMatchObject({
      formatVersion: 1,
      accountId: 'account-a',
      entityType: 'world',
      entityId: 'world-1',
      baseVersion: 4,
      baseUpdatedAt: '2026-11-18T00:00:00.000Z',
      modifiedAt: '2026-11-18T01:00:00.000Z',
      revision: 1,
    })
    expect(listEntityDrafts(storage, 'account-b', 'world', 'world-1')).toEqual([])
    expect(listEntityDrafts(storage, 'account-a', 'character', 'world-1')).toEqual([])
    expect(listEntityDrafts(storage, 'account-a', 'world', 'world-1')).toEqual([saved])
  })

  it('keeps simultaneous tabs as separate drafts and deletes only the selected revision', () => {
    const storage = createStorage()
    const input = {
      accountId: 'account-a',
      entityType: 'character' as const,
      entityId: 'character-1',
      isNew: false,
      baseVersion: 1,
      baseUpdatedAt: '2026-11-18T00:00:00.000Z',
      data: { name: 'edit' },
    }
    const tabA = saveEntityDraft(storage, { ...input, instanceId: 'tab-a' })
    const tabB = saveEntityDraft(storage, { ...input, instanceId: 'tab-b' })

    expect(listEntityDrafts(storage, 'account-a', 'character', 'character-1')).toHaveLength(2)
    expect(deleteEntityDraft(storage, { ...tabA, revision: 2 })).toBe(false)
    expect(deleteEntityDraft(storage, tabA)).toBe(true)
    expect(listEntityDrafts(storage, 'account-a', 'character', 'character-1')).toEqual([tabB])
  })

  it('finds unsaved drafts and never stores inline media data', () => {
    const storage = createStorage()
    const draft = saveEntityDraft(storage, {
      accountId: 'account-a',
      entityType: 'character',
      entityId: 'local-character-id',
      isNew: true,
      instanceId: 'tab-a',
      baseVersion: null,
      baseUpdatedAt: null,
      data: {
        portraitUrl: 'data:image/png;base64,private-image',
        accessToken: 'private-token',
        password: 'private-password',
        name: 'Local edit',
      },
    })

    expect(listEntityDrafts(storage, 'account-a', 'character', null)).toEqual([draft])
    expect(draft.data).toEqual({ portraitUrl: '', name: 'Local edit' })
    expect(storage.getItem(storage.key(0)!)).not.toContain('private-image')
    expect(storage.getItem(storage.key(0)!)).not.toContain('private-token')
    expect(storage.getItem(storage.key(0)!)).not.toContain('private-password')
  })

  it('reports damaged storage instead of silently replacing its contents', () => {
    const key = 'swade-entity-draft-v1:account-a:world:world-1:tab-a'
    const storage = createStorage({ [key]: '{broken' })

    expect(() => listEntityDrafts(storage, 'account-a', 'world', null))
      .toThrowError(expect.objectContaining({ code: 'corrupt' }))
    expect(() => saveEntityDraft(storage, {
      accountId: 'account-a',
      entityType: 'world',
      entityId: 'world-1',
      isNew: false,
      instanceId: 'tab-a',
      baseVersion: 1,
      baseUpdatedAt: null,
      data: {},
    })).toThrowError(expect.objectContaining({ code: 'corrupt' }))
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it("does not let another account's damaged draft block discovery", () => {
    const storage = createStorage({
      'swade-entity-draft-v1:account-b:world:world-1:tab-b': '{broken',
    })

    expect(listEntityDrafts(storage, 'account-a', 'world', 'world-1')).toEqual([])
  })

  it('reports quota exhaustion explicitly', () => {
    const storage = createStorage()
    storage.setItem.mockImplementation(() => {
      throw Object.assign(new Error('full'), { name: 'QuotaExceededError' })
    })

    expect(() => saveEntityDraft(storage, {
      accountId: 'account-a',
      entityType: 'world',
      entityId: 'world-1',
      isNew: false,
      instanceId: 'tab-a',
      baseVersion: 1,
      baseUpdatedAt: null,
      data: {},
    })).toThrowError(expect.objectContaining({ code: 'quotaExceeded' }))
  })

  it('reports inaccessible storage explicitly', () => {
    const storage = createStorage()
    storage.getItem.mockImplementation(() => { throw new Error('denied') })
    storage.key = () => 'swade-entity-draft-v1:account-a:world:world-1:tab-a'
    Object.defineProperty(storage, 'length', { value: 1 })

    expect(() => listEntityDrafts(storage, 'account-a', 'world', 'world-1'))
      .toThrowError(expect.objectContaining({ code: 'unavailable' }))
  })
})
