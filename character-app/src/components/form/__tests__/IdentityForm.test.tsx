import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { IdentityForm } from '@/components/form/IdentityForm'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

describe('IdentityForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('renders an explicit Wild Card toggle bound to the character', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(IdentityForm, {
      character: enDefaultCharacter,
      onChange: vi.fn(),
    }))

    expect(html).toContain('id="isWildCard"')
    expect(html).toContain('Wild Card')
    expect(html).toContain('data-state="checked"')
  })

  it('renders a canonical rank select rather than a free-text rank field', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')

    const html = renderToStaticMarkup(createElement(IdentityForm, {
      character: enDefaultCharacter,
      onChange: vi.fn(),
    }))

    expect(html).toContain('id="rank"')
    expect(html).toContain('data-slot="select-trigger"')
    expect(html).not.toMatch(/data-slot="input"[^>]+id="rank"/)
  })
})