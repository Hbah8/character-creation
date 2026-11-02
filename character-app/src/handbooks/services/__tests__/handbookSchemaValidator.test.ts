import { describe, expect, it } from 'vitest'
import { validateHandbookEntrySchema } from '@/handbooks/services/handbookSchemaValidator'

describe('validateHandbookEntrySchema', () => {
  it('accepts a complete custom edge that declares a pace modifier', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'fleet-footed',
      handbookCategory: 'edge',
      name: 'Fleet-Footed',
      description: 'A character with exceptional speed.',
      type: 'Background',
      modifiers: [{ type: 'combat', stat: 'pace', amount: 2 }],
    })).toEqual([])
  })

  it('reports a schema error when an edge modifier targets damage', () => {
    const errors = validateHandbookEntrySchema({
      mode: 'custom',
      id: 'invalid-edge',
      handbookCategory: 'edge',
      name: 'Invalid',
      description: '',
      type: 'Combat',
      modifiers: [{ type: 'combat', stat: 'damage', amount: 1 }],
    })

    expect(errors).not.toEqual([])
  })

  it('uses handbookCategory without conflicting with a custom weapon category', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'short-sword',
      handbookCategory: 'weapon',
      name: 'Short Sword',
      description: 'A versatile one-handed blade.',
      category: 'Melee',
      damage: 'Str+d6',
    })).toEqual([])
  })

  it('accepts a structured weapon range with an area template', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'grenade',
      handbookCategory: 'weapon',
      name: 'Grenade',
      description: '',
      category: 'Thrown',
      damage: '3d6',
      range: { type: 'bands', short: 5, medium: 10, long: 20 },
      areaTemplate: 'small',
      rof: 1,
      weight: 0.5,
    })).toEqual([])
  })

  it('accepts cone as an area template', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'flamethrower',
      handbookCategory: 'weapon',
      name: 'Flamethrower',
      description: '',
      category: 'Ranged',
      damage: '3d6',
      range: { type: 'bands', short: 6, medium: 6, long: 6 },
      areaTemplate: 'cone',
    })).toEqual([])
  })

  it('rejects invalid structured weapon range distances', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'invalid-range',
      handbookCategory: 'weapon',
      name: 'Invalid Range',
      description: '',
      category: 'Ranged',
      damage: '2d6',
      range: { type: 'bands', short: 12, medium: -1, long: 48 },
    })).not.toEqual([])
  })

  it('rejects extreme range for thrown weapons', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'extreme-throwing-knife',
      handbookCategory: 'weapon',
      name: 'Extreme Throwing Knife',
      description: '',
      category: 'Thrown',
      damage: 'Str+d4',
      range: { type: 'bands', short: 3, medium: 6, long: 12, extreme: true },
    })).not.toEqual([])
  })

  it('accepts a complete custom skill and rejects an invalid linked attribute', () => {
    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'spellcasting',
      handbookCategory: 'skill',
      name: 'Spellcasting',
      description: 'Cast spells.',
      linkedAttribute: 'smarts',
      isCore: false,
    })).toEqual([])

    expect(validateHandbookEntrySchema({
      mode: 'custom',
      id: 'invalid-skill',
      handbookCategory: 'skill',
      name: 'Invalid',
      description: '',
      linkedAttribute: 'luck',
      isCore: false,
    })).not.toEqual([])
  })
})