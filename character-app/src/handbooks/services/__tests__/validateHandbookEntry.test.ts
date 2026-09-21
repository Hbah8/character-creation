import { describe, expect, it } from 'vitest'
import { validateHandbookEntry } from '@/handbooks/services/validateHandbookEntry'

describe('validateHandbookEntry', () => {
  it('accepts a complete custom edge with declared modifiers', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'fleet-footed',
      handbookCategory: 'edge',
      name: 'Fleet-Footed',
      description: 'A character with exceptional speed.',
      type: 'Background',
      modifiers: [{ type: 'combat', stat: 'pace', amount: 2 }],
    })

    expect(entry).toMatchObject({
      mode: 'custom',
      id: 'fleet-footed',
      handbookCategory: 'edge',
      modifiers: [{ type: 'combat', stat: 'pace', amount: 2 }],
    })
  })

  it('accepts a partial override without requiring system fields', () => {
    const entry = validateHandbookEntry({
      mode: 'override',
      id: 'level-headed',
      handbookCategory: 'edge',
      modifiers: [{ type: 'combat', stat: 'bennies', amount: 1 }],
    })

    expect(entry).toEqual({
      mode: 'override',
      id: 'level-headed',
      handbookCategory: 'edge',
      modifiers: [{ type: 'combat', stat: 'bennies', amount: 1 }],
    })
  })

  it('rejects a modifier targeting a stat that cannot be calculated', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      id: 'invalid-edge',
      handbookCategory: 'edge',
      name: 'Invalid',
      description: '',
      type: 'Combat',
      modifiers: [{ type: 'combat', stat: 'damage', amount: 1 }],
    })).toThrow('validation.handbook.invalidModifierStat')
  })

  it('rejects a custom weapon without its category-specific required fields', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      handbookCategory: 'weapon',
      id: 'incomplete-weapon',
      name: 'Incomplete Weapon',
      description: '',
    })).toThrow('validation.handbook.missingRequiredField')
  })

  it('rejects an Edge requirement with an invalid die', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      id: 'invalid-requirement',
      handbookCategory: 'edge',
      name: 'Invalid requirement',
      description: '',
      type: 'Combat',
      requirements: {
        allOf: [{ type: 'skill', skill: 'fighting', minimum: 'd20' }],
      },
    })).toThrow('validation.handbook.invalidRequirements')
  })
})