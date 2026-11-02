import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WeaponsForm } from '@/components/form/WeaponsForm'
import { SWADE_WEAPONS } from '@/data/handbooks/weapons'

describe('WeaponsForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('offers handbook selection while retaining the manual add action', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(WeaponsForm, {
      weapons: [],
      availableWeapons: SWADE_WEAPONS,
      onAdd: vi.fn(),
      onAddFromHandbook: vi.fn(),
      onUpdate: vi.fn(),
      onRemove: vi.fn(),
      column: 'left',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('Add from handbook')
    expect(html).toContain('Add Weapon')
  })
})
