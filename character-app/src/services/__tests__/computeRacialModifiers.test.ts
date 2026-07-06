import { describe, it, expect } from 'vitest'
import { computeRacialModifiers } from '@/services/computeRacialModifiers'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityRef } from '@/world/types'

// Minimal catalog entries for testing
const CATALOG: ResolvedRacialAbility[] = [
  { id: 'pace', name: 'Pace', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'parry', name: 'Parry', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'weak-parry', name: 'Weak Parry', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'tough', name: 'Tough', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'fragile', name: 'Fragile', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'armor', name: 'Armor', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'size-plus-1', name: 'Size +1', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'size-minus-1', name: 'Size -1', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'attribute-bonus', name: 'Attribute Bonus', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [] },
  { id: 'attribute-penalty', name: 'Attribute Penalty', description: '', type: 'negative', source: 'system', points: -2, maxRepeat: 'unlimited', parameterSchema: [] },
]

describe('computeRacialModifiers', () => {
  it('returns zero modifiers for empty ability list', () => {
    const result = computeRacialModifiers([], CATALOG)
    expect(result.paceBonus).toBe(0)
    expect(result.parryBonus).toBe(0)
    expect(result.toughnessBonus).toBe(0)
    expect(result.armorBonus).toBe(0)
    expect(result.attributeSteps.size).toBe(0)
  })

  it('computes pace bonus as +2 per repeatCount', () => {
    const refs: RacialAbilityRef[] = [{ id: 'pace', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).paceBonus).toBe(2)
  })

  it('stacks pace bonus for repeatCount > 1', () => {
    const refs: RacialAbilityRef[] = [{ id: 'pace', repeatCount: 2 }]
    expect(computeRacialModifiers(refs, CATALOG).paceBonus).toBe(4)
  })

  it('computes parry bonus from parry ability', () => {
    const refs: RacialAbilityRef[] = [{ id: 'parry', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).parryBonus).toBe(1)
  })

  it('computes parry penalty from weak-parry ability', () => {
    const refs: RacialAbilityRef[] = [{ id: 'weak-parry', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).parryBonus).toBe(-1)
  })

  it('computes toughness bonus from tough ability', () => {
    const refs: RacialAbilityRef[] = [{ id: 'tough', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).toughnessBonus).toBe(1)
  })

  it('computes toughness penalty from fragile ability', () => {
    const refs: RacialAbilityRef[] = [{ id: 'fragile', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).toughnessBonus).toBe(-1)
  })

  it('computes armor bonus as +2 per repeatCount', () => {
    const refs: RacialAbilityRef[] = [{ id: 'armor', repeatCount: 1 }]
    expect(computeRacialModifiers(refs, CATALOG).armorBonus).toBe(2)
  })

  it('stacks armor bonus for repeatCount > 1', () => {
    const refs: RacialAbilityRef[] = [{ id: 'armor', repeatCount: 2 }]
    expect(computeRacialModifiers(refs, CATALOG).armorBonus).toBe(4)
  })

  it('intentionally ignores size-plus-1 because size is derived separately', () => {
    const refs: RacialAbilityRef[] = [{ id: 'size-plus-1', repeatCount: 3 }]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.paceBonus).toBe(0)
    expect(result.parryBonus).toBe(0)
    expect(result.toughnessBonus).toBe(0)
    expect(result.armorBonus).toBe(0)
    expect(result.attributeSteps.size).toBe(0)
  })

  it('intentionally ignores size-minus-1 because size is derived separately', () => {
    const refs: RacialAbilityRef[] = [{ id: 'size-minus-1', repeatCount: 1 }]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.toughnessBonus).toBe(0)
  })

  it('computes attribute-bonus steps for a specific attribute', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-bonus', repeatCount: 1, parameters: { attributeId: 'agility' } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.attributeSteps.get('agility')).toBe(1)
  })

  it('accumulates multiple attribute-bonus steps on the same attribute', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-bonus', repeatCount: 2, parameters: { attributeId: 'strength' } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.attributeSteps.get('strength')).toBe(2)
  })

  it('computes attribute-penalty of -1 step with default cost (-2)', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-penalty', repeatCount: 1, parameters: { attributeId: 'smarts' } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    // cost = ability.points = -2, which is > -3, so penalty = 1 step
    expect(result.attributeSteps.get('smarts')).toBe(-1)
  })

  it('computes attribute-penalty of -2 steps when costTier is -3', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-penalty', repeatCount: 1, parameters: { attributeId: 'spirit', costTier: -3 } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.attributeSteps.get('spirit')).toBe(-2)
  })

  it('produces zero contribution for unknown ability ids', () => {
    const refs: RacialAbilityRef[] = [{ id: 'unknown-ability-xyz' }]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.paceBonus).toBe(0)
    expect(result.parryBonus).toBe(0)
    expect(result.toughnessBonus).toBe(0)
    expect(result.armorBonus).toBe(0)
    expect(result.attributeSteps.size).toBe(0)
  })

  it('handles ability with no repeatCount (defaults to 1)', () => {
    const refs: RacialAbilityRef[] = [{ id: 'pace' }]
    expect(computeRacialModifiers(refs, CATALOG).paceBonus).toBe(2)
  })

  it('combines multiple different abilities correctly', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'pace', repeatCount: 1 },
      { id: 'parry', repeatCount: 1 },
      { id: 'armor', repeatCount: 1 },
      { id: 'tough', repeatCount: 1 },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.paceBonus).toBe(2)
    expect(result.parryBonus).toBe(1)
    expect(result.armorBonus).toBe(2)
    expect(result.toughnessBonus).toBe(1)
  })
})
