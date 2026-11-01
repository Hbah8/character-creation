import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { SheetTemplateControls } from '../SheetTemplateControls'

describe('SheetTemplateControls', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('exposes independent preview and print selectors', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetTemplateControls, {
      previewTemplate: 'compact',
      printTemplate: 'classic',
      onPreviewTemplateChange: () => undefined,
      onPrintTemplateChange: () => undefined,
    }))

    expect(html).toContain('aria-label="Preview template"')
    expect(html).toContain('aria-label="Print template"')
  })
})
