import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT } from '@/types/character'
import { resolveSheetLayout } from '../templates/sheetTemplateLayout'

describe('resolveSheetLayout', () => {
  it('uses a saved layout override for the selected template', () => {
    const layout = { ...DEFAULT_LAYOUT, weapons: 'right' as const }

    expect(resolveSheetLayout({
      layout: DEFAULT_LAYOUT,
      templateLayouts: { compact: layout },
    }, 'compact', DEFAULT_LAYOUT)).toEqual(layout)
  })

  it('uses the legacy layout for classic characters', () => {
    const layout = { ...DEFAULT_LAYOUT, edges: 'left' as const }

    expect(resolveSheetLayout({ layout }, 'classic', DEFAULT_LAYOUT)).toEqual(layout)
  })

  it('does not apply the classic legacy layout to another template', () => {
    const classicLayout = { ...DEFAULT_LAYOUT, weapons: 'right' as const }

    expect(resolveSheetLayout({ layout: classicLayout }, 'compact', DEFAULT_LAYOUT)).toEqual(DEFAULT_LAYOUT)
  })
})
