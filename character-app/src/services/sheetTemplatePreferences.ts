import type { SheetTemplateId } from '@/types/character'

export interface SheetTemplatePreferences {
  previewTemplate: SheetTemplateId
  printTemplate: SheetTemplateId
}

export const DEFAULT_SHEET_TEMPLATE_PREFERENCES: SheetTemplatePreferences = {
  previewTemplate: 'classic',
  printTemplate: 'classic',
}

export const SHEET_TEMPLATE_PREFERENCES_KEY = 'swade-sheet-template-preferences'

interface PreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function isSheetTemplateId(value: unknown): value is SheetTemplateId {
  return value === 'classic' || value === 'compact'
}

export function loadSheetTemplatePreferences(
  storage: PreferenceStorage = localStorage,
): SheetTemplatePreferences {
  const stored = storage.getItem(SHEET_TEMPLATE_PREFERENCES_KEY)
  if (!stored) return { ...DEFAULT_SHEET_TEMPLATE_PREFERENCES }

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    return { ...DEFAULT_SHEET_TEMPLATE_PREFERENCES }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULT_SHEET_TEMPLATE_PREFERENCES }
  }

  const values = parsed as Record<string, unknown>
  return {
    previewTemplate: isSheetTemplateId(values.previewTemplate)
      ? values.previewTemplate
      : DEFAULT_SHEET_TEMPLATE_PREFERENCES.previewTemplate,
    printTemplate: isSheetTemplateId(values.printTemplate)
      ? values.printTemplate
      : DEFAULT_SHEET_TEMPLATE_PREFERENCES.printTemplate,
  }
}

export function saveSheetTemplatePreferences(
  preferences: SheetTemplatePreferences,
  storage: PreferenceStorage = localStorage,
): void {
  storage.setItem(SHEET_TEMPLATE_PREFERENCES_KEY, JSON.stringify(preferences))
}
