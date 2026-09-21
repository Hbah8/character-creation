import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HandbookEntryDetail } from '@/handbooks/components/HandbookEntryDetail'

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
})