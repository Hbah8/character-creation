import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetAttributesSkills } from '../SheetAttributesSkills'

describe('SheetAttributesSkills compact variant', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('groups each attribute with its skills in a compact grid', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetAttributesSkills, {
      variant: 'compact',
      attributes: {
        agility: 'd8',
        strength: 'd6',
        smarts: 'd6',
        spirit: 'd6',
        vigor: 'd6',
      },
      skills: [
        {
          id: 'notice',
          skillKey: 'notice',
          die: 'd8',
          name: 'Notice',
          linkedAttribute: 'smarts',
          isStarter: true,
        },
        {
          id: 'athletics',
          skillKey: 'athletics',
          die: 'd6',
          name: 'Athletics',
          linkedAttribute: 'strength',
          isStarter: false,
        },
        {
          id: 'survival',
          skillKey: 'survival',
          die: 'd8',
          name: 'Survival',
          linkedAttribute: 'vigor',
          isStarter: false,
        },
      ],
    }))

    expect(html).toContain('compact-attribute-grid')
    expect(html).toContain('data-attribute="strength"')
    expect(html).toContain('compact-skill-row')
    expect(html).toContain('<span>Notice</span><strong>d8</strong>')
    expect(html).toContain('compact-attribute-column')
    expect(html).toContain('compact-attribute-skill-table')
    expect(html).toContain('compact-attribute-card--derived')
    expect(html).toContain('compact-attribute-card--derived-with-skills')
    expect(html).toContain('<span>Athletics</span><strong>d6</strong>')
    expect(html).toContain('<span>Survival</span><strong>d8</strong>')
    expect(html).toContain('AGILITY')
  })

  it('keeps strength and vigor centered when they have no skills', () => {
    const html = renderToStaticMarkup(createElement(SheetAttributesSkills, {
      variant: 'compact',
      attributes: {
        agility: 'd8',
        strength: 'd6',
        smarts: 'd6',
        spirit: 'd6',
        vigor: 'd6',
      },
      skills: [],
    }))

    expect(html).toContain('compact-attribute-card--derived" data-attribute="strength"')
    expect(html).toContain('compact-attribute-card--derived" data-attribute="vigor"')
    expect(html).not.toContain('compact-attribute-card--derived-with-skills')
    expect(html).not.toContain('compact-attribute-grid--has-derived-skills')
  })
})
