import { describe, expect, it } from 'vitest'
import { addCatalogSkill } from '@/services/characterSkillService'
import { getAvailableSkillDefinitions } from '@/handbooks/services/resolveCharacterSkills'
import { SWADE_SKILLS } from '@/data/handbooks/skills'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import { ruDefaultCharacter } from '@/i18n/locales/ru/defaults'

describe('character skill creation', () => {
  it('preselects every core SWADE skill in both new-character templates', () => {
    const coreSkillIds = SWADE_SKILLS.filter(skill => skill.isCore).map(skill => skill.id)

    for (const character of [ruDefaultCharacter, enDefaultCharacter]) {
      expect(character.skills.map(skill => skill.skillKey)).toEqual(expect.arrayContaining(coreSkillIds))
    }
  })

  it('adds a strict system-catalog reference and does not duplicate it', () => {
    const skills = addCatalogSkill([], 'shooting', 'row-shooting')

    expect(skills).toEqual([{ id: 'row-shooting', skillKey: 'shooting', die: 'd4' }])
    expect(addCatalogSkill(skills, 'shooting', 'duplicate-row')).toBe(skills)
  })

  it('offers unselected skills from the default catalog', () => {
    const available = getAvailableSkillDefinitions([
      { id: 'row-athletics', skillKey: 'athletics', die: 'd6' },
    ], [])

    expect(available.map(skill => skill.id)).toContain('shooting')
    expect(available.map(skill => skill.id)).not.toContain('athletics')
  })

  it('offers an unselected custom-world skill alongside system skills', () => {
    const available = getAvailableSkillDefinitions([], [
      {
        mode: 'custom',
        handbookCategory: 'skill',
        id: 'house-magic',
        name: 'House Magic',
        description: '',
        linkedAttribute: 'spirit',
        isCore: true,
      },
    ])

    expect(available).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'house-magic', name: 'House Magic', linkedAttribute: 'spirit', isCore: true }),
    ]))
  })
})
