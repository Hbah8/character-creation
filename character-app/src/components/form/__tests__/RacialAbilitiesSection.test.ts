import { describe, it, expect } from 'vitest'
import { resolveRaceAbilityNames } from '@/components/form/RacialAbilitiesSection'
import type { RacialAbilityRef } from '@/world/types'
import type { HandbookOverride } from '@/types/handbook'

describe('resolveRaceAbilityNames', () => {
  it('returns empty array for empty abilities list', () => {
    const result = resolveRaceAbilityNames([], [])
    expect(result).toEqual([])
  })

  it('resolves a known system ability id to its name', () => {
    const refs: RacialAbilityRef[] = [{ id: 'armor' }]
    const result = resolveRaceAbilityNames(refs, [])
    expect(result).toHaveLength(1)
    expect(result[0]).toBeTypeOf('string')
    expect(result[0].length).toBeGreaterThan(0)
    expect(result[0]).not.toBe('armor')
  })

  it('uses world override name when it exists', () => {
    const refs: RacialAbilityRef[] = [{ id: 'armor' }]
    const worldHandbook: HandbookOverride[] = [
      { id: 'armor', category: 'racialAbility', name: 'World Armor Override' },
    ]
    const result = resolveRaceAbilityNames(refs, worldHandbook)
    expect(result[0]).toBe('World Armor Override')
  })

  it('falls back to the ability id when ability is not found in catalog', () => {
    const refs: RacialAbilityRef[] = [{ id: 'unknown-ability-xyz' }]
    const result = resolveRaceAbilityNames(refs, [])
    expect(result[0]).toBe('unknown-ability-xyz')
  })

  it('returns one name per ability ref, preserving order', () => {
    const refs: RacialAbilityRef[] = [{ id: 'armor' }, { id: 'pace' }]
    const result = resolveRaceAbilityNames(refs, [])
    expect(result).toHaveLength(2)
  })
})
