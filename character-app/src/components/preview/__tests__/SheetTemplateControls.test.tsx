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

  it('exposes one selector for the sheet template', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(SheetTemplateControls, {
      templateId: 'compact',
      onTemplateChange: () => undefined,
    }))

    expect(html).toContain('aria-label="Sheet template"')
    expect(html).not.toContain('>Sheet template</span>')
    expect(html).not.toContain('Preview template')
    expect(html).not.toContain('Print template')
    expect(html.match(/aria-label="Sheet template"/g)).toHaveLength(1)
  })
})
