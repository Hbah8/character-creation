import { SWADE_SKILLS } from '@/data/handbooks/skills'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { Skill } from '@/types/character'
import type { StoredHandbookEntry } from '@/types/handbook'

export function resolveCharacterSkills(
  skills: readonly Skill[],
  worldHandbook: readonly StoredHandbookEntry[],
): Skill[] {
  const definitions = resolveHandbookEntries('skill', [...worldHandbook], [...SWADE_SKILLS])
  const definitionsById = new Map(definitions.map(definition => [definition.id, definition]))

  return skills.map(skill => {
    const definition = definitionsById.get(skill.skillKey ?? skill.id)
    return definition
      ? { ...skill, linkedAttribute: definition.linkedAttribute, isStarter: definition.isCore }
      : { ...skill }
  })
}