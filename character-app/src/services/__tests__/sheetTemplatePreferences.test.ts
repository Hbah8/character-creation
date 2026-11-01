import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHEET_TEMPLATE_PREFERENCES,
  loadSheetTemplatePreferences,
  saveSheetTemplatePreferences,
} from '../sheetTemplatePreferences'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('sheet template preferences', () => {
  it('uses classic templates when no preference has been saved', () => {
    expect(loadSheetTemplatePreferences(createStorage())).toEqual(DEFAULT_SHEET_TEMPLATE_PREFERENCES)
  })

  it('persists preview and print choices independently', () => {
    const storage = createStorage()
    const preferences = { previewTemplate: 'compact', printTemplate: 'classic' } as const

    saveSheetTemplatePreferences(preferences, storage)

    expect(loadSheetTemplatePreferences(storage)).toEqual(preferences)
  })

  it('falls back to defaults for invalid stored template ids', () => {
    const storage = createStorage()
    storage.setItem('swade-sheet-template-preferences', JSON.stringify({
      previewTemplate: 'unknown',
      printTemplate: 'compact',
    }))

    expect(loadSheetTemplatePreferences(storage)).toEqual({
      ...DEFAULT_SHEET_TEMPLATE_PREFERENCES,
      printTemplate: 'compact',
    })
  })
})
