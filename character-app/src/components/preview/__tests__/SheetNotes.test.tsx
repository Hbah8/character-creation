import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetNotes } from '@/components/preview/SheetNotes'
import type { Character } from '@/types/character'

describe('SheetNotes', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('uses resolved wound and fatigue limits for marker boxes', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetNotes, {
      character: { wounds: '0 / 3', fatigue: '0 / 2', notes: '' } as Character,
      combat: { maxWounds: 4, maxFatigue: 3 },
    }))

    expect(html.match(/class="marker-box"/g)).toHaveLength(8)
  })
})