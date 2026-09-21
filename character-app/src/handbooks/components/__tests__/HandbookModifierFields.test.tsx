import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { HandbookModifierFields } from '@/handbooks/components/HandbookModifierFields'

describe('HandbookModifierFields', () => {
  it('renders the existing modifier and an action to add another', () => {
    const html = renderToStaticMarkup(createElement(HandbookModifierFields, {
      modifiers: [{ type: 'combat', stat: 'pace', amount: 2 }],
      onChange: vi.fn(),
      labels: {
        title: 'Modifiers',
        add: 'Add modifier',
        remove: 'Remove',
        stat: 'Stat',
        amount: 'Amount',
        pace: 'Pace',
      },
    }))

    expect(html).toContain('Modifiers')
    expect(html).toContain('Stat')
    expect(html).toContain('Amount')
    expect(html).toContain('Add modifier')
  })

  it('renders an attribute target for an attribute die-step modifier', () => {
    const html = renderToStaticMarkup(createElement(HandbookModifierFields, {
      modifiers: [{ type: 'attribute-die-step', attribute: 'agility', amount: 1 }],
      onChange: vi.fn(),
      labels: {
        title: 'Modifiers',
        add: 'Add modifier',
        remove: 'Remove',
        stat: 'Stat',
        attribute: 'Attribute',
        amount: 'Amount',
        pace: 'Pace',
      },
    }))

    expect(html).toContain('Attribute')
  })

  it('renders an empty state when no modifiers are configured', () => {
    const html = renderToStaticMarkup(createElement(HandbookModifierFields, {
      modifiers: [],
      onChange: vi.fn(),
      labels: {
        title: 'Modifiers',
        add: 'Add modifier',
        remove: 'Remove',
        stat: 'Stat',
        amount: 'Amount',
        pace: 'Pace',
        none: 'No modifiers configured.',
      },
    }))

    expect(html).toContain('No modifiers configured.')
  })
})