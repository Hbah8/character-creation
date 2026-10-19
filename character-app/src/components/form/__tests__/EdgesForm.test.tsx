import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { EdgesForm } from '@/components/form/EdgesForm'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

describe('EdgesForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders catalog data and picker controls instead of manual edge fields', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
    const character = {
      ...enDefaultCharacter,
      edges: [{ id: 'custom-row', edgeId: 'house-edge' }],
    }

    const html = renderToStaticMarkup(createElement(EdgesForm, {
      character,
      worldHandbook: [{
        mode: 'custom',
        handbookCategory: 'edge',
        id: 'house-edge',
        name: 'House Edge',
        description: 'World-specific edge description.',
        type: 'Weird',
      }],
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onArcaneBackgroundChange: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('House Edge')
    expect(html).toContain('World-specific edge description.')
    expect(html).toContain('Search edges')
    expect(html).toContain('Show unavailable edges')
    expect(html).toContain('class="flex min-w-0 flex-col gap-2"')
    expect(html).toContain('class="flex min-w-0 flex-col gap-2 rounded-md border p-3"')
    expect(html).toContain('class="text-sm break-words text-muted-foreground"')
    expect(html).not.toContain('Edge name')
    expect(html).not.toContain('Describe the edge effect')
  })

  it('shows Arcane Background selection only after Mystic Gift is selected', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(EdgesForm, {
      character: {
        ...enDefaultCharacter,
        edges: [{ id: 'gift-row', edgeId: 'misticheskiy-dar' }],
      },
      worldHandbook: [],
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onArcaneBackgroundChange: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('Arcane Background')
    expect(html).toContain('Requirements')
    expect(html).toContain('Novice')
  })
})