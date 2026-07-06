import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { WORLD_SCHEMA_VERSION } from '@/world/types'
import type { Race, World } from '@/world/types'

function makeWorld(): World {
  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    name: 'Test World',
    summary: '',
    settingRules: {
      skillPointsBudget: 12,
      attributePointsBudget: 5,
      racePointsBudget: 2,
    },
    races: [],
    entities: [],
    relationships: [],
    worldHandbook: [],
  }
}

describe('SheetRacialAbilities', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'ru'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    vi.stubGlobal('navigator', { language: 'ru-RU' })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders derived race size as a visible racial feature', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('ru')
    const { SheetRacialAbilities } = await import('@/components/preview/SheetRacialAbilities')

    const race: Race = {
      id: 'large-race',
      name: 'Large Race',
      description: '',
      size: 0,
      abilities: [{ id: 'size-plus-1', repeatCount: 2 }],
    }

    const html = renderToStaticMarkup(createElement(SheetRacialAbilities, {
      race,
      world: makeWorld(),
    }))

    expect(html).toContain('Расовые особенности')
    expect(html).toContain('Размер +2, Стойкость +2, максимум Силы +2 ступень(и).')
  })

  it('does not render stored race size when size ability refs are absent', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('ru')
    const { SheetRacialAbilities } = await import('@/components/preview/SheetRacialAbilities')

    const race: Race = {
      id: 'stale-large-race',
      name: 'Stale Large Race',
      description: '',
      size: 2,
      abilities: [],
    }

    const html = renderToStaticMarkup(createElement(SheetRacialAbilities, {
      race,
      world: makeWorld(),
    }))

    expect(html).not.toContain('Размер +2, Стойкость +2, максимум Силы +2 ступень(и).')
  })
})
