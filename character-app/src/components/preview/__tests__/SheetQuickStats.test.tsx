import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetQuickStats } from '@/components/preview/SheetQuickStats'
import type { Character } from '@/types/character'

const CHARACTER = {
  pace: '99',
  parry: '99',
  toughness: '99',
  bennies: '3',
  mana: '10',
  size: 0,
} as Character

describe('SheetQuickStats', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders explicit resolved combat values and the running die', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetQuickStats, {
      character: CHARACTER,
      combat: { pace: 6, parry: 5, toughness: 7, armor: 2, runningDie: 'd8', size: 1 },
    }))

    expect(html).toContain('6')
    expect(html).toContain('7 (2)')
    expect(html).toContain('Running')
    expect(html).toContain('d8')
    expect(html).not.toContain('99')
  })
})