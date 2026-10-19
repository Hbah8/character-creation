import { describe, expect, it } from 'vitest'
import {
  getAvailableSkillDefinitions,
  resolveCharacterSkills,
  sortSkillsByLinkedAttribute,
} from '@/handbooks/services/resolveCharacterSkills'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

describe('resolveCharacterSkills', () => {
  it('sorts skills by the requested attribute order and alphabetically within each attribute', () => {
    const skills = sortSkillsByLinkedAttribute([
      { name: 'Воля', linkedAttribute: 'spirit' },
      { name: 'Зоркость', linkedAttribute: 'agility' },
      { name: 'Атлетика', linkedAttribute: 'agility' },
      { name: 'Сила', linkedAttribute: 'strength' },
      { name: 'Мудрость', linkedAttribute: 'smarts' },
      { name: 'Выносливость', linkedAttribute: 'vigor' },
    ])

    expect(skills.map(skill => skill.name)).toEqual([
      'Атлетика',
      'Зоркость',
      'Мудрость',
      'Воля',
      'Сила',
      'Выносливость',
    ])
  })

  it('returns skill-picker options grouped by linked attribute and alphabetized within each group', () => {
    const skills = getAvailableSkillDefinitions([], [])
    const attributeOrder = ['agility', 'smarts', 'spirit', 'strength', 'vigor']
    const collator = new Intl.Collator('ru', { sensitivity: 'base' })

    expect([...new Set(skills.map(skill => skill.linkedAttribute))]).toEqual(
      attributeOrder.filter(attribute => skills.some(skill => skill.linkedAttribute === attribute)),
    )

    for (const attribute of attributeOrder) {
      const names = skills
        .filter(skill => skill.linkedAttribute === attribute)
        .map(skill => skill.name)
      expect(names).toEqual([...names].sort(collator.compare))
    }
  })

  it('resolves every skill in the default character against the system catalog', () => {
    expect(() => resolveCharacterSkills(enDefaultCharacter.skills, [])).not.toThrow()
  })

  it('resolves a strict character skill reference against the system catalog', () => {
    const [skill] = resolveCharacterSkills([
      { id: 'character-athletics', skillKey: 'athletics', die: 'd6' },
    ] as never, [])

    expect(skill).toMatchObject({
      id: 'character-athletics',
      skillKey: 'athletics',
      die: 'd6',
      name: 'Атлетика',
      linkedAttribute: 'agility',
      isStarter: true,
    })
  })

  it('applies custom-world additions and overrides to catalog-backed character skills', () => {
    const skills = resolveCharacterSkills([
      {
        id: 'character-athletics',
        skillKey: 'athletics',
        die: 'd6',
      },
      { id: 'character-house-magic', skillKey: 'house-magic', die: 'd4' },
    ], [
      {
        mode: 'override',
        handbookCategory: 'skill',
        id: 'athletics',
        linkedAttribute: 'strength',
        isCore: false,
      },
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

    expect(skills[0]).toMatchObject({ linkedAttribute: 'strength', isStarter: false })
    expect(skills[1]).toMatchObject({ name: 'House Magic', linkedAttribute: 'spirit', isStarter: true })
  })

  it('rejects a reference not found in the effective catalog', () => {
    expect(() => resolveCharacterSkills([
      { id: 'unknown-row', skillKey: 'unknown-skill', die: 'd4' },
    ] as never, [])).toThrow('validation.skill.unknownSkill:unknown-skill')
  })
})