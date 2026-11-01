import type { Character, CharacterLayout, SheetTemplateId } from '@/types/character'

type CharacterLayouts = Pick<Character, 'layout' | 'templateLayouts'>

export function resolveSheetLayout(
  character: CharacterLayouts,
  templateId: SheetTemplateId,
  defaultLayout: CharacterLayout,
): CharacterLayout {
  return character.templateLayouts?.[templateId]
    ?? (templateId === 'classic' ? character.layout : undefined)
    ?? defaultLayout
}
