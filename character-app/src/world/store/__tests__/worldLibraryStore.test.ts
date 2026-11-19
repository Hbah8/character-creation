import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultWorld } from '@/world/data/defaultWorld'
import { WorldLibraryStore } from '@/world/store/worldLibraryStore'

afterEach(() => vi.unstubAllGlobals())

function response(id: string) {
  return Response.json([{
    id,
    version: 1,
    createdAt: '2026-11-07T18:00:00Z',
    updatedAt: '2026-11-07T18:00:00Z',
    world: getDefaultWorld('en'),
  }])
}

describe('world library store', () => {
  it('loads account-owned worlds without reading browser-local originals', async () => {
    const fetch = vi.fn().mockResolvedValue(response('account-a-world'))
    vi.stubGlobal('fetch', fetch)
    const localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }
    vi.stubGlobal('localStorage', localStorage)
    const store = new WorldLibraryStore()

    await store.load('account-a')

    expect(store.getSnapshot('account-a').entries.map(entry => entry.id)).toEqual(['account-a-world'])
    expect(store.getSnapshot('account-b').entries).toEqual([])
    expect(localStorage.getItem).not.toHaveBeenCalled()
  })

  it('ignores a stale account response after the active account changes', async () => {
    let resolveAccountA!: (value: Response) => void
    const fetch = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>(resolve => { resolveAccountA = resolve }))
      .mockResolvedValueOnce(response('account-b-world'))
    vi.stubGlobal('fetch', fetch)
    const store = new WorldLibraryStore()

    const requestA = store.load('account-a')
    await store.load('account-b')
    resolveAccountA(response('account-a-world'))
    await requestA

    expect(store.getSnapshot('account-b').entries.map(entry => entry.id)).toEqual(['account-b-world'])
    expect(store.getSnapshot('account-a').entries).toEqual([])
  })

  it.each([
    'worldEntitiesLimitReached', 'worldRelationshipsLimitReached',
    'worldRacesLimitReached', 'worldHandbookLimitReached',
  ])('keeps the server entry unchanged after %s', async code => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response('world-1'))
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(Response.json({ code }, { status: 400 })))
    const store = new WorldLibraryStore()
    await store.load('account-a')
    const draft = { ...getDefaultWorld('en'), summary: 'Unsaved graph edits' }

    await store.saveById('account-a', 'world-1', draft)

    expect(store.getSnapshot('account-a')).toMatchObject({
      entries: [{ id: 'world-1', version: 1, world: getDefaultWorld('en') }],
      error: { code, operation: 'save', worldId: 'world-1' },
    })
  })

  it('requires an explicit, version-specific confirmation to overwrite a conflict', async () => {
    const id = 'world-1'
    const latest = {
      id,
      version: 2,
      createdAt: '2026-11-07T18:00:00Z',
      updatedAt: '2026-11-07T18:01:00Z',
      world: { ...getDefaultWorld('en'), summary: 'Remote edit' },
    }
    const saved = { ...latest, version: 3, world: { ...getDefaultWorld('en'), summary: 'My draft' } }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json([{ ...latest, version: 1 }]))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-conflict' }))
      .mockResolvedValueOnce(Response.json({ code: 'conflict' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json(latest, { headers: { ETag: '"2"' } }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-retry' }))
      .mockResolvedValueOnce(Response.json(saved, { headers: { ETag: '"3"' } }))
    vi.stubGlobal('fetch', fetch)
    const store = new WorldLibraryStore()
    await store.load('account-a')

    await store.saveById('account-a', id, saved.world)
    expect(store.getSnapshot('account-a').entries[0]).toMatchObject({
      version: 1,
      world: { summary: 'Remote edit' },
    })
    expect(store.getSnapshot('account-a').error?.code).toBe('conflict')

    const target = await store.getOverwriteTarget('account-a', id)
    expect(target).toEqual({ version: 2, updatedAt: latest.updatedAt })
    await store.retrySave('account-a', id, target.version)

    expect(store.getSnapshot('account-a').entries[0]).toMatchObject({
      version: 3,
      world: { summary: 'My draft' },
    })
    expect(fetch.mock.calls[5][1]).toMatchObject({
      method: 'PUT',
      headers: { 'If-Match': '"2"' },
    })
  })

  it('does not fetch a newer version or bypass a second conflict after confirmation', async () => {
    const latest = {
      id: 'world-1',
      version: 2,
      createdAt: '2026-11-07T18:00:00Z',
      updatedAt: '2026-11-07T18:01:00Z',
      world: { ...getDefaultWorld('en'), summary: 'Remote edit' },
    }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json([{ ...latest, version: 1 }]))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-first' }))
      .mockResolvedValueOnce(Response.json({ code: 'conflict' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json(latest, { headers: { ETag: '"2"' } }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-confirmed' }))
      .mockResolvedValueOnce(Response.json({ code: 'conflict' }, { status: 409 }))
    vi.stubGlobal('fetch', fetch)
    const store = new WorldLibraryStore()
    await store.load('account-a')
    await store.saveById('account-a', 'world-1', { ...getDefaultWorld('en'), summary: 'My draft' })

    const target = await store.getOverwriteTarget('account-a', 'world-1')
    await store.retrySave('account-a', 'world-1', target.version)

    expect(store.getSnapshot('account-a').error?.code).toBe('conflict')
    expect(fetch).toHaveBeenCalledTimes(6)
    expect(fetch.mock.calls[5][1]).toMatchObject({
      method: 'PUT',
      headers: { 'If-Match': '"2"' },
    })
  })

  it('retains a quota-rejected new world draft for an explicit retry', async () => {
    const saved = {
      id: 'created-world',
      version: 1,
      createdAt: '2026-11-07T18:00:00Z',
      updatedAt: '2026-11-07T18:00:00Z',
      world: getDefaultWorld('en'),
    }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-failed' }))
      .mockResolvedValueOnce(Response.json({ code: 'worldLimitReached' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-retry' }))
      .mockResolvedValueOnce(Response.json(saved, { status: 201, headers: { ETag: '"1"' } }))
    vi.stubGlobal('fetch', fetch)
    const store = new WorldLibraryStore()
    await store.load('account-a')
    await expect(store.save('account-a', null, saved.id, saved.world))
      .rejects.toMatchObject({ code: 'worldLimitReached' })

    await store.retryCreate('account-a')

    expect(store.getSnapshot('account-a')).toMatchObject({
      currentId: saved.id,
      entries: [{ id: saved.id, world: saved.world }],
      error: null,
    })
  })
})
