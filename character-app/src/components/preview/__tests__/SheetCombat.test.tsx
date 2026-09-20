import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetCombat } from '@/components/preview/SheetCombat'
describe('SheetCombat', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'en'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders armor in the combat parameters table', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetCombat, {
      combat: {
        pace: 6,
        parry: 5,
        toughness: 8,
        armor: 2,
        runningDie: 'd6',
        size: 0,
        bennies: 3,
        maxWounds: 3,
        maxFatigue: 2,
        powerPoints: 0,
      },
    }))

    expect(html).toContain('Armor')
    expect(html).toContain('<td>2</td>')
  })
})
