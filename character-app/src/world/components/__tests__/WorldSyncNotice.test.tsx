import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseWorldLibrary } = vi.hoisted(() => ({ mockUseWorldLibrary: vi.fn() }))
vi.mock('@/world/store/useWorldLibrary', () => ({ useWorldLibrary: mockUseWorldLibrary }))

import { WorldSyncNotice } from '@/world/components/WorldSyncNotice'

describe('WorldSyncNotice', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  beforeEach(async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.clearAllMocks())
  afterAll(() => vi.unstubAllGlobals())

  it('explains conflicts and exposes explicit overwrite or reload choices', () => {
    mockUseWorldLibrary.mockReturnValue({
      error: { code: 'conflict', operation: 'save', worldId: 'world-1' },
      retrySave: vi.fn(),
      reloadWorld: vi.fn(),
      reload: vi.fn(),
    })

    const html = renderToStaticMarkup(createElement(WorldSyncNotice))

    expect(html).toContain('This world changed in another browser')
    expect(html).toContain('Overwrite latest')
    expect(html).toContain('Reload latest')
  })

  it('keeps delete-reference failures visible without offering a misleading retry', () => {
    mockUseWorldLibrary.mockReturnValue({
      error: { code: 'referencedResource', operation: 'delete', worldId: 'world-1' },
      retrySave: vi.fn(),
      reloadWorld: vi.fn(),
      reload: vi.fn(),
    })

    const html = renderToStaticMarkup(createElement(WorldSyncNotice))

    expect(html).toContain('This world is still used by a character or another record')
    expect(html).not.toContain('Try again')
  })
})
