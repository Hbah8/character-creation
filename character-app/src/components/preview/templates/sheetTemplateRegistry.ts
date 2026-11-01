import { DEFAULT_LAYOUT } from '@/types/character'
import type { CharacterLayout, SheetTemplateId } from '@/types/character'
import { ClassicSheetShell } from './ClassicSheetShell'
import { CompactSheetShell } from './CompactSheetShell'
import type { SheetTemplate } from './sheetTemplateTypes'

export const COMPACT_DEFAULT_LAYOUT: CharacterLayout = {
  ...DEFAULT_LAYOUT,
  gear: 'left',
  specialRules: 'left',
}

export const SHEET_TEMPLATES: Record<SheetTemplateId, SheetTemplate> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    Shell: ClassicSheetShell,
    defaultLayout: DEFAULT_LAYOUT,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    Shell: CompactSheetShell,
    defaultLayout: COMPACT_DEFAULT_LAYOUT,
  },
}

export function getSheetTemplate(id: SheetTemplateId): SheetTemplate {
  return SHEET_TEMPLATES[id]
}
