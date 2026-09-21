import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HandbookFilterPanel } from '@/handbooks/components/HandbookFilterPanel'
import { createEmptyHandbookFilters } from '@/handbooks/utils/filterHandbookEntries'

describe('HandbookFilterPanel', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('shows linked attribute and core skill filters for the skill handbook', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(HandbookFilterPanel, {
      category: 'skill',
      entries: [
        { id: 'athletics', name: 'Athletics', description: '', linkedAttribute: 'agility', isCore: true },
        { id: 'fighting', name: 'Fighting', description: '', linkedAttribute: 'agility', isCore: false },
      ],
      filters: createEmptyHandbookFilters(),
      onFiltersChange: vi.fn(),
    }))

    expect(html).toContain('Linked attribute')
    expect(html).toContain('Core skills')
    expect(html).toContain('Other skills')
  })
})