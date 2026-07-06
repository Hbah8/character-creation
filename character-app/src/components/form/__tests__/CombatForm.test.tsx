import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CombatForm } from '@/components/form/CombatForm'
import type { Character } from '@/types/character'

const CHARACTER = {
  pace: '6',
  parry: '5',
  toughness: '6',
  armor: '2',
  bennies: '3',
  wounds: '0',
  fatigue: '0',
  mana: '10',
} as Character

describe('CombatForm', () => {
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

  it('renders armor as an editable combat parameter', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(CombatForm, {
      character: CHARACTER,
      onChange: () => {},
    }))

    expect(html).toContain('id="armor"')
    expect(html).toContain('value="2"')
  })
})
