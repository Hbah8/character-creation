import { describe, expect, it } from 'vitest'
import { resolveCharacterSkills } from '@/handbooks/services/resolveCharacterSkills'

describe('resolveCharacterSkills', () => {
  it('applies a world skill override to catalog-backed character skills', () => {
    const skills = resolveCharacterSkills([
      {
        id: 'character-athletics',
        skillKey: 'athletics',
        name: 'Athletics',
        die: 'd6',
        linkedAttribute: 'agility',
        isStarter: false,
      },
    ], [
      {
        mode: 'override',
        handbookCategory: 'skill',
        id: 'athletics',
        linkedAttribute: 'strength',
        isCore: false,
      },
    ])

    expect(skills[0]).toMatchObject({ linkedAttribute: 'strength', isStarter: false })
  })

  it('leaves skills without a known catalog key unchanged', () => {
    const [skill] = resolveCharacterSkills([
      {
        id: 'driving',
        name: 'Driving',
        die: 'd6',
        linkedAttribute: 'agility',
        isStarter: false,
      },
    ], [])

    expect(skill).toMatchObject({ id: 'driving', linkedAttribute: 'agility', isStarter: false })
  })
})