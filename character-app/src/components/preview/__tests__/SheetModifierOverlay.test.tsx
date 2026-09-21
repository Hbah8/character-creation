import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SheetModifierOverlay } from '@/components/preview/SheetModifierOverlay'

describe('SheetModifierOverlay', () => {
  it('renders the base value, active sources, and resolved total for one stat', () => {
    const html = renderToStaticMarkup(createElement(SheetModifierOverlay, {
      label: 'Pace',
      baseValue: 6,
      total: 8,
      modifiers: [{
        id: 'fleet-footed',
        source: 'edge',
        name: 'Fleet-Footed',
        stat: 'pace',
        amount: 2,
      }],
    }))

    expect(html).toContain('Pace')
    expect(html).toContain('Fleet-Footed')
    expect(html).toContain('+2')
    expect(html).toContain('8')
  })
})