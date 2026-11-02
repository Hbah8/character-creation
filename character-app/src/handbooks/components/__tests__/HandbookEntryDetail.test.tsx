import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HandbookEntryDetail } from '@/handbooks/components/HandbookEntryDetail'
import { HandbookEntry } from '@/handbooks/components/HandbookEntry'
import { HandbookStatList } from '@/handbooks/components/HandbookStatList'

describe('HandbookEntryDetail', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('shows configured combat modifiers for an edge', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'fleet-footed',
        name: 'Fleet-Footed',
        description: '',
        type: 'Background',
        modifiers: [{ type: 'combat', stat: 'pace', amount: 2 }],
      },
    }))

    expect(html).toContain('Modifiers')
    expect(html).toContain('Pace')
    expect(html).toContain('+2')
  })

  it('renders all-of and any-of Edge requirements', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'marksman',
        name: 'Marksman',
        description: '',
        type: 'Combat',
        requirements: {
          allOf: [
            { type: 'rank', minimum: 'Seasoned' },
            { type: 'attribute', attribute: 'agility', minimum: 'd8' },
            {
              anyOf: [
                { type: 'skill', skill: 'athletics', minimum: 'd8' },
                { type: 'skill', skill: 'shooting', minimum: 'd8' },
              ],
            },
          ],
        },
      },
    }))

    expect(html).toContain('Seasoned')
    expect(html).toContain('Agility d8')
    expect(html).toContain('Атлетика d8 or Стрельба d8')
  })

  it('shows a skill linked attribute and core status', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'athletics',
        name: 'Athletics',
        description: '',
        linkedAttribute: 'agility',
        isCore: true,
      },
    }))

    expect(html).toContain('Linked attribute')
    expect(html).toContain('Agility')
    expect(html).toContain('Core skill')
  })

  it('uses resolved world skill references in Edge requirements', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'world-edge',
        name: 'World Edge',
        description: '',
        type: 'Weird',
        requirements: { allOf: [{ type: 'skill', skill: 'spellcasting', minimum: 'd6' }] },
      },
      skillReferences: [{ id: 'spellcasting', name: 'House Magic' }],
    }))

    expect(html).toContain('House Magic d6')
  })

  it('renders structured weapon range, area template, rate of fire, and weight', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'grenade',
        name: 'Grenade',
        description: '',
        category: 'Thrown',
        damage: '3d6',
        range: { type: 'bands', short: 5, medium: 10, long: 20 },
        areaTemplate: 'small',
        rof: 1,
        weight: 0.5,
      },
    }))

    expect(html).toContain('5/10/20')
    expect(html).toContain('Small')
    expect(html).toContain('RoF')
    expect(html).toContain('0.5 lb')
  })

  it('shows rate of fire and weight as weapon handbook columns', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookStatList, {
      entries: [{
        id: 'machine-pistol',
        name: 'Machine Pistol',
        description: '',
        category: 'Ranged',
        damage: '2d6',
        range: { type: 'bands', short: 12, medium: 24, long: 48, extreme: true },
        rof: 3,
        weight: 5,
      }],
      hasActiveFilters: false,
    }))

    expect(html).toContain('RoF')
    expect(html).toContain('Weight')
    expect(html).toContain('3')
    expect(html).toContain('5 lb')
    expect(html).toContain('Extreme range allowed')
  })

  it('renders cone as an area template independently from range', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntryDetail, {
      entry: {
        id: 'flamethrower',
        name: 'Flamethrower',
        description: '',
        category: 'Ranged',
        damage: '3d6',
        range: { type: 'bands', short: 6, medium: 6, long: 6 },
        areaTemplate: 'cone',
      },
    }))

    expect(html).toContain('6/6/6')
    expect(html).toContain('Cone')
  })

  it('does not render a missing weapon category as an untranslated key', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookEntry, {
      entry: {
        id: 'legacy-flamethrower',
        name: 'Flamethrower',
        description: '',
        damage: '3d6',
      } as never,
    }))

    expect(html).toContain('Category not specified')
    expect(html).not.toContain('enums.weaponCategory.undefined')
  })

  it('localizes a standard weapon name and description in the handbook entry', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('ru')

    const html = renderToStaticMarkup(createElement(HandbookEntry, {
      entry: {
        id: 'knife',
        name: 'Knife',
        description: 'A small blade suitable for cutting or close-quarters fighting.',
        category: 'Melee',
        damage: 'Str+d4',
      },
      source: 'system',
    }))

    expect(html).toContain('Нож')
    expect(html).toContain('Небольшой клинок для резки и ближнего боя.')
    expect(html).not.toContain('A small blade suitable')
  })
})