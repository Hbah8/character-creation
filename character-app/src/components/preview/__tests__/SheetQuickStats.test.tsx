import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetQuickStats } from '@/components/preview/SheetQuickStats'
describe('SheetQuickStats', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders resolved combat values, running die, and resource limits', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetQuickStats, {
      combat: {
        pace: 6,
        parry: 5,
        toughness: 7,
        armor: 2,
        runningDie: 'd8',
        size: 1,
        bennies: 4,
        maxWounds: 3,
        maxFatigue: 2,
        powerPoints: 10,
      },
    }))

    expect(html).toContain('6')
    expect(html).toContain('7 (2)')
    expect(html).toContain('Running')
    expect(html).toContain('d8')
    expect(html).toContain('>4</button>')
    expect(html).toContain('>10</button>')
    expect(html).toContain('title="Show calculation"')
    expect(html).not.toContain('99')
  })
})