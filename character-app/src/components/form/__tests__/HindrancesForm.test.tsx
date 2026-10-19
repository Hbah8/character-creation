import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HindrancesForm } from '@/components/form/HindrancesForm'

describe('HindrancesForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders the resolved system and world hindrance picker', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HindrancesForm, {
      hindrances: [],
      worldHandbook: [{
        mode: 'override',
        handbookCategory: 'hindrance',
        id: 'boleznennost',
        name: 'World Sickness',
        description: 'A world-specific effect.',
      }],
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('World Sickness')
    expect(html).toContain('A world-specific effect.')
    expect(html).toContain('Верный друг')
    expect(html).toContain('Search hindrances')
    expect(html).toContain('Type')
    expect(html).toContain('Major')
    expect(html).not.toContain('Add Hindrance')
    expect(html).not.toContain('Hindrance name')
    expect(html).not.toContain('textarea')
  })

  it('shows selected hindrances as read-only handbook entries with a remove action', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HindrancesForm, {
      hindrances: [{
        id: 'selected-row',
        hindranceId: 'boleznennost',
        name: 'Fallback name',
        severity: 'minor',
        description: 'Fallback description',
      }],
      worldHandbook: [{
        mode: 'override',
        handbookCategory: 'hindrance',
        id: 'boleznennost',
        name: 'World Sickness',
        description: 'A world-specific effect.',
      }],
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('World Sickness')
    expect(html).toContain('A world-specific effect.')
    expect(html).toContain('Remove hindrance')
    expect(html).not.toContain('Fallback name')
    expect(html).not.toContain('textarea')
  })
})
