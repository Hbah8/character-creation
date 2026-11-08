import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultWorld } from '@/world/data/defaultWorld'
import { WorldApiError, worldApi } from '@/world/services/worldApi'

afterEach(() => vi.unstubAllGlobals())

const world = getDefaultWorld('en')
const record = {
  id: 'b6f207f5-c86d-4552-8b62-179415d4f17f',
  version: 3,
  createdAt: '2026-11-07T18:00:00Z',
  updatedAt: '2026-11-07T18:00:00Z',
  world,
}

describe('world API', () => {
  it('creates and updates worlds with CSRF protection and optimistic versions', async () => {
    const updated = { ...record, version: 4, updatedAt: '2026-11-07T18:01:00Z' }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf-create' }))
      .mockResolvedValueOnce(Response.json(record, { status: 201, headers: { ETag: '"3"' } }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-update' }))
      .mockResolvedValueOnce(Response.json(updated, { headers: { ETag: '"4"' } }))
    vi.stubGlobal('fetch', fetch)

    await expect(worldApi.create(world)).resolves.toEqual(record)
    await expect(worldApi.update(record.id, 3, world)).resolves.toEqual(updated)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/csrf', '/api/worlds', '/api/auth/csrf', `/api/worlds/${record.id}`,
    ])
    expect(fetch.mock.calls[3][1]).toMatchObject({
      method: 'PUT',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-CSRF-TOKEN': 'csrf-update', 'If-Match': '"3"' },
      body: JSON.stringify({ world }),
    })
  })

  it('lists and deletes only after the caller supplies the current version', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json([record]))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-delete' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await expect(worldApi.list()).resolves.toEqual([record])
    await expect(worldApi.delete(record.id, 3)).resolves.toBeUndefined()
    expect(fetch.mock.calls[2][1]).toMatchObject({
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': 'csrf-delete', 'If-Match': '"3"' },
    })
  })

  it('preserves conflicts and rejects malformed records', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf-conflict' }))
      .mockResolvedValueOnce(Response.json({ code: 'conflict' }, { status: 409 })))
    await expect(worldApi.update(record.id, 3, world))
      .rejects.toMatchObject({ code: 'conflict' } satisfies Partial<WorldApiError>)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json([{ ...record, version: 0 }]),
    ))
    await expect(worldApi.list()).rejects.toBeInstanceOf(WorldApiError)
  })
})
