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
})