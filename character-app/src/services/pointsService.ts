import type { Character, Skill, DieName, AttributeKey } from '@/types/character'

const DIE_ORDER: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12']

export const DEFAULT_ATTRIBUTE_POINTS_BUDGET = 5
export const DEFAULT_SKILL_POINTS_BUDGET = 12

function dieIndex(die: DieName): number {
  return DIE_ORDER.indexOf(die)
}

/**
 * Returns the number of attribute points spent.
 * Each attribute starts at d4 (index 0). Each step above d4 costs 1 point.
 * Budget: 5 points.
 */
export function calcAttributePointsSpent(character: Character, _budget = DEFAULT_ATTRIBUTE_POINTS_BUDGET): number {
  const attrs: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']
  return attrs.reduce((total, key) => {
    const idx = dieIndex(character[key] as DieName)
    return total + Math.max(0, idx)
  }, 0)
}

/**
 * Returns the number of skill points spent across all skills.
 * Each die step from d4 upward costs:
 *   1 point  if the step's die level ≤ the linked attribute's die
 *   2 points if the step's die level > the linked attribute's die
 * If isStarter = true, the d4 level is free (skip that step).
 * Budget: 12 points.
 */
export function calcSkillPointsSpent(skills: Skill[], character: Character, _budget = DEFAULT_SKILL_POINTS_BUDGET): number {
  return skills.reduce((total, skill) => {
    const skillIdx = dieIndex(skill.die)
    if (skillIdx < 0) return total

    const attrIdx = dieIndex(character[skill.linkedAttribute] as DieName)
    let cost = 0

    for (let i = 0; i <= skillIdx; i++) {
      // Starter skill: d4 (index 0) is free
      if (skill.isStarter && i === 0) continue
      cost += i <= attrIdx ? 1 : 2
    }

    return total + cost
  }, 0)
}
