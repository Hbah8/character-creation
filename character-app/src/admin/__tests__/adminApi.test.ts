import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminApi, AdminApiError } from '@/admin/adminApi'

afterEach(() => vi.unstubAllGlobals())

describe('administrator API', () => {
  it('loads safe paged account rows and sends CSRF protection for a blocking action', async () => {
    const account = {
      id: 'a8aed0c8-023c-4c54-89d1-1b4a1f96a8a8',
      email: 'player@example.com',
      createdAt: '2026-11-13T21:00:00Z',
      emailVerified: true,
      status: 'pending',
      worldCount: 0,
      characterCount: 0,
    }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ items: [account], total: 1, page: 0, size: 25 }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-token' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await expect(adminApi.accounts({ query: 'player', status: 'pending', page: 0 }))
      .resolves.toMatchObject({ items: [account], total: 1 })
    await expect(adminApi.block(account.id)).resolves.toBeUndefined()
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/admin/accounts?query=player&status=pending&page=0&size=25',
      '/api/auth/csrf',
      `/api/admin/accounts/${account.id}/block`,
    ])
    expect(fetch.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
    })
  })

  it('surfaces a denied administrator request as a stable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'forbidden' }, { status: 403 })))
    await expect(adminApi.accounts({})).rejects.toBeInstanceOf(AdminApiError)
  })
})
