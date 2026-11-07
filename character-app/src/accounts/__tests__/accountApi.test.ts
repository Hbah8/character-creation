import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountApi, AccountApiError, onSessionEnded } from '@/accounts/accountApi'

afterEach(() => vi.unstubAllGlobals())

describe('same-origin account API', () => {
  it('distinguishes unverified credentials from unavailable non-JSON server responses', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(Response.json({ code: 'emailUnverified' }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(new Response('Bad gateway', { status: 502 })))
    await expect(accountApi.login('user@example.test', 'correct horse battery staple'))
      .rejects.toMatchObject({ code: 'emailUnverified' })
    await expect(accountApi.login('user@example.test', 'correct horse battery staple'))
      .rejects.toMatchObject({ code: 'unavailable' })
  })
  it('fetches a fresh CSRF token before every mutation and sends only cookie credentials', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'masked-csrf-one' }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(Response.json({ token: 'masked-csrf-two' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    await accountApi.register('player@example.com', 'correct horse battery staple')
    await accountApi.logout()
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/csrf', '/api/auth/register', '/api/auth/csrf', '/api/auth/logout',
    ])
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-CSRF-TOKEN': 'masked-csrf-one' },
      body: JSON.stringify({ email: 'player@example.com', password: 'correct horse battery staple' }),
    })
    expect(fetch.mock.calls[3][1].headers['X-CSRF-TOKEN']).toBe('masked-csrf-two')
  })

  it('treats an anonymous current-user response as signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'unauthenticated' }, { status: 401 })))
    expect(await accountApi.current()).toBeNull()
  })

  it('notifies the application immediately on a protected API 401 and on logout', async () => {
    const ended = vi.fn()
    const unsubscribe = onSessionEnded(ended)
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ code: 'unauthenticated' }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))
    try {
      await expect(accountApi.sessions()).rejects.toMatchObject({ code: 'unauthenticated' })
      expect(ended).toHaveBeenCalledTimes(1)
      await accountApi.logout()
      expect(ended).toHaveBeenCalledTimes(2)
    } finally {
      unsubscribe()
    }
  })

  it('requires server-provided session expiry before accepting authenticated state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'id', email: 'user@example.test' })))
    await expect(accountApi.current()).rejects.toMatchObject({ code: 'invalidResponse' })
  })

  it('surfaces rate limits and connection failures with stable UI error codes', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(Response.json({ code: 'rateLimited' }, { status: 429 }))
      .mockRejectedValueOnce(new TypeError('network failure'))
    vi.stubGlobal('fetch', fetch)
    await expect(accountApi.resend('player@example.com')).rejects.toMatchObject({ code: 'rateLimited' })
    await expect(accountApi.current()).rejects.toMatchObject({ code: 'unavailable' })
  })

  it('rejects invalid API response shapes instead of populating success-shaped account state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ email: 'missing-id@example.com' })))
    await expect(accountApi.current()).rejects.toBeInstanceOf(AccountApiError)
  })

  it('lists safe session metadata and uses its revocation handle, not a cookie ID', async () => {
    const session = {
      id: 'public-handle',
      createdAt: '2026-11-05T00:00:00Z',
      lastAccessAt: '2026-11-05T01:00:00Z',
      expiresAt: '2026-12-05T01:00:00Z',
      current: true,
    }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json([session]))
      .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    expect(await accountApi.sessions()).toEqual([session])
    await accountApi.revoke(session.id)
    expect(fetch.mock.calls[2][0]).toBe('/api/auth/sessions/public-handle')
    expect(fetch.mock.calls[2][1].method).toBe('DELETE')
  })
})
