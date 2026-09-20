import { describe, expect, it } from 'vitest'
import { computeRacialModifiers } from '@/services/computeRacialModifiers'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'

describe('computeRacialModifiers', () => {
  it('uses declarative catalog effects instead of an ability identifier', () => {
    const catalog: ResolvedRacialAbility[] = [{
      id: 'custom-guarded',
      name: 'Guarded',
      description: '',
      type: 'positive',
      points: 1,
      effects: [{ type: 'parry', amount: 2 }],
      source: 'world',
    }]

    const result = computeRacialModifiers([{ id: 'custom-guarded', repeatCount: 1, parameters: {} }], catalog)

    expect(result.parryBonus).toBe(2)
  })
})

import type { RacialAbilityRef } from '@/world/types'

// Minimal catalog entries for testing
const CATALOG: ResolvedRacialAbility[] = [
  { id: 'pace', name: 'Pace', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'pace', amount: 2 }] },
  { id: 'parry', name: 'Parry', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'parry', amount: 1 }] },
  { id: 'weak-parry', name: 'Weak Parry', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'parry', amount: -1 }] },
  { id: 'tough', name: 'Tough', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'toughness', amount: 1 }] },
  { id: 'fragile', name: 'Fragile', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'toughness', amount: -1 }] },
  { id: 'armor', name: 'Armor', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'armor', amount: 2 }] },
  { id: 'size-plus-1', name: 'Size +1', description: '', type: 'positive', source: 'system', points: 1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'recommended-size', amount: 1 }] },
  { id: 'size-minus-1', name: 'Size -1', description: '', type: 'negative', source: 'system', points: -1, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'recommended-size', amount: -1 }] },
  { id: 'attribute-bonus', name: 'Attribute Bonus', description: '', type: 'positive', source: 'system', points: 2, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'attribute-die-step', attributeParameter: 'attributeId', amount: 1 }] },
  { id: 'attribute-penalty', name: 'Attribute Penalty', description: '', type: 'negative', source: 'system', points: -2, maxRepeat: 'unlimited', parameterSchema: [], effects: [{ type: 'attribute-check-penalty', attributeParameter: 'attributeId', amount: -1, amountByCost: { '-3': -2 } }] },
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

  it('computes an attribute-check penalty without changing the attribute die', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-penalty', repeatCount: 1, parameters: { attributeId: 'smarts' } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.attributeSteps.get('smarts')).toBeUndefined()
    expect(result.attributeCheckPenalties.get('smarts')).toBe(-1)
  })

  it('computes a -2 attribute-check penalty when costTier is -3', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'attribute-penalty', repeatCount: 1, parameters: { attributeId: 'spirit', costTier: -3 } },
    ]
    const result = computeRacialModifiers(refs, CATALOG)
    expect(result.attributeSteps.get('spirit')).toBeUndefined()
    expect(result.attributeCheckPenalties.get('spirit')).toBe(-2)
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

  it('applies the minor short-pace Pace and running-die penalties', () => {
    const catalog: ResolvedRacialAbility[] = [{
      id: 'short-pace', name: 'Short pace', description: '', type: 'negative', points: -1,
      effects: [{ type: 'pace', amount: -1, amountByCost: { '-2': -3 }, runningDieSteps: -1 }], source: 'system',
    }]

    const result = computeRacialModifiers([{ id: 'short-pace', repeatCount: 1, parameters: { costTier: -1 } }], catalog)

    expect(result.paceBonus).toBe(-1)
    expect(result.runningDieSteps).toBe(-1)
  })

  it('applies the major short-pace Pace and running-die penalties', () => {
    const catalog: ResolvedRacialAbility[] = [{
      id: 'short-pace', name: 'Short pace', description: '', type: 'negative', points: -1,
      effects: [{ type: 'pace', amount: -1, amountByCost: { '-2': -3 }, runningDieSteps: -1 }], source: 'system',
    }]

    const result = computeRacialModifiers([{ id: 'short-pace', repeatCount: 1, parameters: { costTier: -2 } }], catalog)

    expect(result.paceBonus).toBe(-3)
    expect(result.runningDieSteps).toBe(-1)
  })
})
