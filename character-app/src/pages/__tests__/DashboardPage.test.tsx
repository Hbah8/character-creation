import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import { getDefaultWorld } from '@/world/data/defaultWorld'

const { characterLibrary, worldLibrary } = vi.hoisted(() => ({
  characterLibrary: vi.fn(),
  worldLibrary: vi.fn(),
}))

vi.mock('@/store/useCharacterLibrary', () => ({ useCharacterLibrary: characterLibrary }))
vi.mock('@/world/store/useWorldLibrary', () => ({ useWorldLibrary: worldLibrary }))
vi.mock('@/accounts/useSessionAccount', () => ({ useSessionAccount: () => ({ id: 'owner' }) }))
vi.mock('react-router-dom', async importOriginal => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => vi.fn(),
}))

import { DashboardPage } from '@/pages/DashboardPage'

describe('DashboardPage world context', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: () => 'en', setItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })
  afterAll(() => vi.unstubAllGlobals())
  beforeEach(async () => {
    await (await import('@/i18n')).default.changeLanguage('en')
    characterLibrary.mockReturnValue({
      entries: [
        { id: 'b', version: 1, updatedAt: '2026-11-08T12:00:00Z',
          character: { ...enDefaultCharacter, callsign: 'Beta scout', worldId: 'b' } },
        { id: 'a', version: 1, updatedAt: '2026-11-07T12:00:00Z',
          character: { ...enDefaultCharacter, callsign: 'Alpha scout', worldId: 'a' } },
        { id: 'solo', version: 1, updatedAt: '2026-11-06T12:00:00Z',
          character: { ...enDefaultCharacter, callsign: 'Solo scout' } },
      ],
      loading: false, error: null, remove: vi.fn(),
    })
    worldLibrary.mockReturnValue({
      activeWorldId: null, loading: false,
      entries: [{ id: 'a', world: { ...getDefaultWorld('en'), name: 'Alpha world' } }],
    })
  })

  it('limits the grid, count and last-edited summary to standalone characters', () => {
    const html = renderToStaticMarkup(createElement(DashboardPage))
    expect(html).toContain('Solo scout')
    expect(html).not.toContain('Alpha scout')
    expect(html).not.toContain('Beta scout')
    expect(html).toContain('>1</p>')
    expect(html).toContain('(1)')
    expect(html).toContain('Standalone characters')
  })

  it('limits the grid and summaries to the active world instead of the newest account record', () => {
    worldLibrary.mockReturnValue({
      ...worldLibrary(), activeWorldId: 'a',
    })
    const html = renderToStaticMarkup(createElement(DashboardPage))
    expect(html).toContain('Alpha scout')
    expect(html).not.toContain('Beta scout')
    expect(html).not.toContain('Solo scout')
    expect(html).toContain('>1</p>')
    expect(html).toContain('(1)')
    expect(html).toContain('Alpha world')
    expect(html).not.toContain('Standalone characters')
  })

  it('shows an empty state with zero count for a world without characters', () => {
    worldLibrary.mockReturnValue({ ...worldLibrary(), activeWorldId: 'empty' })
    const html = renderToStaticMarkup(createElement(DashboardPage))
    expect(html).toContain('No saved characters yet.')
    expect(html).toContain('>0</p>')
    for (const name of ['Solo scout', 'Alpha scout', 'Beta scout']) {
      expect(html).not.toContain(name)
    }
  })

  it('does not show account-wide records or final counts while the world context is loading', () => {
    worldLibrary.mockReturnValue({ ...worldLibrary(), loading: true })
    const html = renderToStaticMarkup(createElement(DashboardPage))
    expect(html).toContain('Loading saved characters')
    expect(html).not.toContain('Solo scout')
    expect(html).not.toContain('>3</p>')
  })
})
