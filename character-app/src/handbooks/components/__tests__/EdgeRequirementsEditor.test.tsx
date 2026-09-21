import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { EdgeRequirementsEditor } from '@/handbooks/components/EdgeRequirementsEditor'

describe('EdgeRequirementsEditor', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders an alternative group as structured controls instead of JSON', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(EdgeRequirementsEditor, {
      value: {
        allOf: [
          { type: 'rank', minimum: 'Seasoned' },
          {
            anyOf: [
              { type: 'skill', skill: 'athletics', minimum: 'd8' },
              { type: 'skill', skill: 'shooting', minimum: 'd8' },
            ],
          },
        ],
      },
      references: {
        edges: [{ id: 'misticheskiy-dar', name: 'Arcane Background' }],
        hindrances: [{ id: 'durnoy-harakter', name: 'Mean' }],
        races: [{ id: 'human', name: 'Human' }],
        skills: [
          { id: 'athletics', name: 'Athletics' },
          { id: 'shooting', name: 'Shooting' },
        ],
      },
      onChange: vi.fn(),
    }))

    expect(html).toContain('All conditions must be met')
    expect(html).toContain('At least one of')
    expect(html).toContain('>and</span>')
    expect(html).toContain('Add alternative')
    expect(html).not.toContain('Structured requirements (JSON)')
  })

  it('renders skill requirements as a resolved reference selector', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(EdgeRequirementsEditor, {
      value: { allOf: [{ type: 'skill', skill: 'athletics', minimum: 'd8' }] },
      references: {
        edges: [],
        hindrances: [],
        races: [],
        skills: [{ id: 'athletics', name: 'Athletics' }],
      },
      onChange: vi.fn(),
    }))

    expect(html).not.toContain('<input')
    expect(html).toContain('role="combobox"')
  })
})