import type { SheetTemplateId } from '@/types/character'

export interface SheetTemplatePreferences {
  templateId: SheetTemplateId
}

export const DEFAULT_SHEET_TEMPLATE_PREFERENCES: SheetTemplatePreferences = {
  templateId: 'classic',
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
  if (isSheetTemplateId(values.templateId)) return { templateId: values.templateId }
  if (isSheetTemplateId(values.previewTemplate)) return { templateId: values.previewTemplate }
  if (isSheetTemplateId(values.printTemplate)) return { templateId: values.printTemplate }
  return { ...DEFAULT_SHEET_TEMPLATE_PREFERENCES }
}

export function saveSheetTemplatePreferences(
  preferences: SheetTemplatePreferences,
  storage: PreferenceStorage = localStorage,
): void {
  storage.setItem(SHEET_TEMPLATE_PREFERENCES_KEY, JSON.stringify(preferences))
}
