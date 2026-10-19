import { SWADE_SKILLS } from '@/data/handbooks/skills'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { AttributeKey, ResolvedCharacterSkill, Skill } from '@/types/character'
import type { ResolvedEntry, SkillDefinition, StoredHandbookEntry } from '@/types/handbook'

const ATTRIBUTE_SORT_ORDER: Record<AttributeKey, number> = {
  agility: 0,
  smarts: 1,
  spirit: 2,
  strength: 3,
  vigor: 4,
}

const SKILL_NAME_COLLATOR = new Intl.Collator('ru', { sensitivity: 'base' })

export function sortSkillsByLinkedAttribute<T extends { name: string; linkedAttribute: AttributeKey }>(
  skills: readonly T[],
): T[] {
  return [...skills].sort((left, right) =>
    ATTRIBUTE_SORT_ORDER[left.linkedAttribute] - ATTRIBUTE_SORT_ORDER[right.linkedAttribute]
    || SKILL_NAME_COLLATOR.compare(left.name, right.name),
  )
}

export function resolveSkillDefinitions(
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<SkillDefinition>[] {
  return resolveHandbookEntries('skill', [...worldHandbook], [...SWADE_SKILLS])
}

export function getAvailableSkillDefinitions(
  skills: readonly Skill[],
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<SkillDefinition>[] {
  const selectedSkillKeys = new Set(skills.map(skill => skill.skillKey))
  return sortSkillsByLinkedAttribute(
    resolveSkillDefinitions(worldHandbook).filter(skill => !selectedSkillKeys.has(skill.id)),
  )
}

export function resolveCharacterSkills(
  skills: readonly Skill[],
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedCharacterSkill[] {
  const definitions = resolveSkillDefinitions(worldHandbook)
  const definitionsById = new Map(definitions.map(definition => [definition.id, definition]))

  return skills.map(skill => {
    const definition = definitionsById.get(skill.skillKey)
    if (!definition) throw new Error(`validation.skill.unknownSkill:${skill.skillKey}`)
    return {
      ...skill,
      name: definition.name,
      linkedAttribute: definition.linkedAttribute,
      isStarter: definition.isCore,
    }
  })
}