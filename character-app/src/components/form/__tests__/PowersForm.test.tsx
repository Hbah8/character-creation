import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { PowersForm } from '@/components/form/PowersForm'

describe('PowersForm', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'en'), setItem: vi.fn(), removeItem: vi.fn() })
    vi.stubGlobal('navigator', { language: 'en-US' })
  })

  afterAll(() => vi.unstubAllGlobals())

  it('shows catalog selection and the selected-to-available counter', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
    const html = renderToStaticMarkup(createElement(PowersForm, {
      powers: [{
        id: 'row',
        powerId: 'bolt',
        name: 'Bolt',
        ppCost: '1–6',
        range: '12/24/48',
        duration: 'Instant',
        description: 'Resolved description.',
        modifiers: [],
        sourceAvailable: true,
      }],
      availablePowers: [{
        id: 'bolt',
        name: 'Bolt',
        arcaneBackground: ['Magic'],
        ppCost: '1–6',
        range: '12/24/48',
        duration: 'Instant',
        description: 'Resolved description.',
        source: 'system',
      }],
      availablePowerCount: 3,
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onAddModifier: vi.fn(),
      onUpdateModifier: vi.fn(),
      onRemoveModifier: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('1 / 3')
    expect(html).toContain('Choose a power')
    expect(html).toContain('Bolt')
    expect(html).not.toContain('input value=""')
  })

  it('marks a power as using its saved fallback copy', async () => {
    const i18n = (await import('@/i18n')).default
    await i18n.changeLanguage('en')
    const html = renderToStaticMarkup(createElement(PowersForm, {
      powers: [{
        id: 'row',
        powerId: 'missing',
        name: 'Missing Power',
        ppCost: '2',
        range: 'Touch',
        duration: 'Instant',
        description: 'Saved fallback.',
        modifiers: [],
        sourceAvailable: false,
      }],
      availablePowers: [],
      availablePowerCount: 0,
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onAddModifier: vi.fn(),
      onUpdateModifier: vi.fn(),
      onRemoveModifier: vi.fn(),
      column: 'right',
      onColumnChange: vi.fn(),
    }))

    expect(html).toContain('Saved copy')
    expect(html).toContain('Missing Power')
  })
})
