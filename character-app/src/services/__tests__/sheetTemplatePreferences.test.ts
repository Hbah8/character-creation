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

  it('persists one selected template for the sheet', () => {
    const storage = createStorage()
    const preferences = { templateId: 'compact' } as const

    saveSheetTemplatePreferences(preferences, storage)

    expect(loadSheetTemplatePreferences(storage)).toEqual(preferences)
  })

  it('migrates legacy preferences using the current preview template', () => {
    const storage = createStorage()
    storage.setItem('swade-sheet-template-preferences', JSON.stringify({
      previewTemplate: 'compact',
      printTemplate: 'classic',
    }))

    expect(loadSheetTemplatePreferences(storage)).toEqual({ templateId: 'compact' })
  })

  it('falls back to a valid legacy print template when the preview choice is invalid', () => {
    const storage = createStorage()
    storage.setItem('swade-sheet-template-preferences', JSON.stringify({
      previewTemplate: 'unknown',
      printTemplate: 'compact',
    }))

    expect(loadSheetTemplatePreferences(storage)).toEqual({ templateId: 'compact' })
  })

  it('falls back to defaults for invalid stored template ids', () => {
    const storage = createStorage()
    storage.setItem('swade-sheet-template-preferences', JSON.stringify({ templateId: 'unknown' }))

    expect(loadSheetTemplatePreferences(storage)).toEqual(DEFAULT_SHEET_TEMPLATE_PREFERENCES)
  })
})
