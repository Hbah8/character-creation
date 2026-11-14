import { afterEach, describe, expect, it, vi } from 'vitest'
import characterFixture from '../../../../backend/src/test/resources/fixtures/character-rich.json'
import { onSessionEnded } from '@/accounts/accountApi'
import { SavedCharacterApiError, savedCharacterApi } from '@/services/savedCharacterApi'
import { validateCharacterImport } from '@/services/validateImport'

afterEach(() => vi.unstubAllGlobals())

const richCharacter = validateCharacterImport(characterFixture)
const savedCharacter = {
  id: 'b6f207f5-c86d-4552-8b62-179415d4f17f',
  version: 3,
  createdAt: '2026-11-07T18:00:00Z',
  updatedAt: '2026-11-07T18:00:00Z',
  character: richCharacter,
}

describe('saved character API', () => {
  it.each(['worldCharacterLimitReached', 'standaloneCharacterLimitReached'])(
    'preserves %s for creates and moves without changing the draft',
    async code => {
      const character = structuredClone(richCharacter)
      const original = structuredClone(character)
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
        .mockResolvedValueOnce(Response.json({ code }, { status: 409 }))
        .mockResolvedValueOnce(Response.json({ token: 'csrf' }))
        .mockResolvedValueOnce(Response.json({ code }, { status: 409 })))
      await expect(savedCharacterApi.create(character)).rejects.toMatchObject({ code })
      await expect(savedCharacterApi.update(savedCharacter.id, 3, character)).rejects.toMatchObject({ code })
      expect(character).toEqual(original)
    },
  )

  it('uses the authenticated same-origin API and preserves the complete character payload', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf-token' }))
      .mockResolvedValueOnce(Response.json(savedCharacter, {
        status: 201,
        headers: { ETag: '"3"' },
      }))
    vi.stubGlobal('fetch', fetch)

    await expect(savedCharacterApi.create(richCharacter)).resolves.toEqual(savedCharacter)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/auth/csrf',
      '/api/characters',
    ])
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'X-CSRF-TOKEN': 'csrf-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ character: richCharacter }),
    })
  })

  it('sends the exact loaded version on updates and deletions', async () => {
    const updated = { ...savedCharacter, version: 4, updatedAt: '2026-11-07T18:01:00Z' }
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf-update' }))
      .mockResolvedValueOnce(Response.json(updated, { headers: { ETag: '"4"' } }))
      .mockResolvedValueOnce(Response.json({ token: 'csrf-delete' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await expect(savedCharacterApi.update(savedCharacter.id, 3, richCharacter))
      .resolves.toEqual(updated)
    await expect(savedCharacterApi.delete(savedCharacter.id, 4)).resolves.toBeUndefined()
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: 'PUT',
      headers: { 'If-Match': '"3"' },
    })
    expect(fetch.mock.calls[3][1]).toMatchObject({
      method: 'DELETE',
      headers: { 'If-Match': '"4"' },
    })
  })

  it('surfaces conflicts without converting them into successful saves', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ token: 'csrf-token' }))
      .mockResolvedValueOnce(Response.json({ code: 'conflict' }, { status: 409 })))

    await expect(savedCharacterApi.update(savedCharacter.id, 3, richCharacter))
      .rejects.toMatchObject({ code: 'conflict' } satisfies Partial<SavedCharacterApiError>)
  })

  it('signals session expiry and rejects malformed server records', async () => {
    const ended = vi.fn()
    const unsubscribe = onSessionEnded(ended)
    try {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(Response.json({ code: 'unauthenticated' }, { status: 401 })))
      await expect(savedCharacterApi.list()).rejects.toMatchObject({ code: 'unauthenticated' })
      expect(ended).toHaveBeenCalledOnce()

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        Response.json([{ ...savedCharacter, version: 0 }]),
      ))
      await expect(savedCharacterApi.list()).rejects.toBeInstanceOf(SavedCharacterApiError)
    } finally {
      unsubscribe()
    }
  })
})
