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

  it('accepts custom skills and partial skill overrides', () => {
    expect(validateHandbookEntry({
      mode: 'custom',
      handbookCategory: 'skill',
      id: 'spellcasting',
      name: 'Spellcasting',
      description: 'Cast spells.',
      linkedAttribute: 'smarts',
      isCore: false,
    })).toMatchObject({ handbookCategory: 'skill', linkedAttribute: 'smarts', isCore: false })

    expect(validateHandbookEntry({
      mode: 'override',
      handbookCategory: 'skill',
      id: 'athletics',
      linkedAttribute: 'strength',
    })).toMatchObject({ handbookCategory: 'skill', linkedAttribute: 'strength' })
  })

  it('rejects a custom skill with an invalid linked attribute', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      handbookCategory: 'skill',
      id: 'invalid-skill',
      name: 'Invalid',
      description: '',
      linkedAttribute: 'luck',
      isCore: false,
    })).toThrow('validation.handbook.missingRequiredField')
  })

  it('converts legacy weapon distance strings into structured ranges', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'legacy-rifle',
      handbookCategory: 'weapon',
      name: 'Legacy Rifle',
      description: '',
      category: 'Ranged',
      damage: '2d8',
      range: '24/48/96',
    })

    expect(entry).toMatchObject({
      range: { type: 'bands', short: 24, medium: 48, long: 96 },
    })
  })

  it('converts legacy melee range labels into reach ranges', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'legacy-melee',
      handbookCategory: 'weapon',
      name: 'Legacy Melee Weapon',
      description: '',
      category: 'Melee',
      damage: 'Str+d4',
      range: 'ближ.',
    })

    expect(entry).toMatchObject({ range: { type: 'melee' } })
  })

  it('accepts weapon ranges combined with an area template', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'grenade',
      handbookCategory: 'weapon',
      name: 'Grenade',
      description: '',
      category: 'Thrown',
      damage: '3d6',
      range: { type: 'bands', short: 5, medium: 10, long: 20 },
      areaTemplate: 'small',
    })

    expect(entry).toMatchObject({
      range: { type: 'bands', short: 5, medium: 10, long: 20 },
      areaTemplate: 'small',
    })
  })

  it('accepts cone as an area template alongside distance bands', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'flamethrower',
      handbookCategory: 'weapon',
      name: 'Flamethrower',
      description: '',
      category: 'Ranged',
      damage: '3d6',
      range: { type: 'bands', short: 6, medium: 6, long: 6 },
      areaTemplate: 'cone',
    })

    expect(entry).toMatchObject({
      range: { type: 'bands', short: 6, medium: 6, long: 6 },
      areaTemplate: 'cone',
    })
  })

  it('migrates the previous cone range representation to an area template', () => {
    const entry = validateHandbookEntry({
      mode: 'custom',
      id: 'legacy-flamethrower',
      handbookCategory: 'weapon',
      name: 'Legacy Flamethrower',
      description: '',
      category: 'Ranged',
      damage: '3d6',
      range: { type: 'template', shape: 'cone' },
    })

    expect(entry).toMatchObject({ areaTemplate: 'cone' })
    expect(entry).not.toHaveProperty('range')
  })

  it('rejects malformed weapon ranges', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      id: 'invalid-range',
      handbookCategory: 'weapon',
      name: 'Invalid Range',
      description: '',
      category: 'Ranged',
      damage: '2d6',
      range: { type: 'bands', short: 12, medium: -1, long: 48 },
    })).toThrow('validation.handbook.invalidRange')
  })

  it('rejects extreme range for thrown weapons', () => {
    expect(() => validateHandbookEntry({
      mode: 'custom',
      id: 'extreme-throwing-knife',
      handbookCategory: 'weapon',
      name: 'Extreme Throwing Knife',
      description: '',
      category: 'Thrown',
      damage: 'Str+d4',
      range: { type: 'bands', short: 3, medium: 6, long: 12, extreme: true },
    })).toThrow('validation.handbook.invalidRange')
  })
})