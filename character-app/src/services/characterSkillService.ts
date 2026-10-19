import type { Skill } from '@/types/character'

export function addCatalogSkill(skills: readonly Skill[], skillKey: string, id: string): Skill[] {
  if (skills.some(skill => skill.skillKey === skillKey)) return skills as Skill[]
  return [...skills, { id, skillKey, die: 'd4' }]
}