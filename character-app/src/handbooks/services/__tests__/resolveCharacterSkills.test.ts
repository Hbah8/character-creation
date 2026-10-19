import { describe, expect, it } from 'vitest'
import { resolveCharacterSkills } from '@/handbooks/services/resolveCharacterSkills'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'

describe('resolveCharacterSkills', () => {
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