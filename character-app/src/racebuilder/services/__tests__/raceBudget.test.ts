import { describe, expect, it } from 'vitest'
import {
  computeRaceBudget,
  computeRaceBudgetStatus,
  computeSizeFromAbilities,
  computeSpentPoints,
} from '@/racebuilder/services/raceBudget'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { Race, RacialAbilityRef, World } from '@/world/types'

const catalog: ResolvedRacialAbility[] = [
  {
    id: 'armor',
    name: 'Armor',
    description: '',
    type: 'positive',
    points: 1,
    maxRepeat: 3,
    parameterSchema: [],
    source: 'system',
  },
  {
    id: 'flight',
    name: 'Flight',
    description: '',
    type: 'positive',
    pointCostOptions: [2, 4, 6],
    maxRepeat: 1,
    parameterSchema: [{ type: 'cost-tier', key: 'costTier', labelKey: 'parameters.costTier' }],
    source: 'system',
  },
  {
    id: 'hindrance',
    name: 'Hindrance',
    description: '',
    type: 'negative',
    pointCostOptions: [-1, -2],
    maxRepeat: 'unlimited',
    parameterSchema: [{ type: 'hindrance-ref', key: 'hindranceId', labelKey: 'parameters.hindrance' }],
    source: 'system',
  },
]

function world(settingRules: Partial<World['settingRules']> = {}): World {
  return {
    schemaVersion: 1,
    name: 'World',
    summary: '',
    settingRules: {
      skillPointsBudget: 12,
      attributePointsBudget: 5,
      ...settingRules,
    },
    races: [],
    worldHandbook: [],
    entities: [],
    relationships: [],
  }
}

function race(abilities: RacialAbilityRef[], size = 0): Race {
  return {
    id: 'test-race',
    name: 'Test Race',
    description: '',
    abilities,
    size,
  }
}

describe('race budget services', () => {
  it('defaults the race point budget to 2', () => {
    expect(computeRaceBudget(world())).toBe(2)
  })

  it('uses a custom world race point budget', () => {
    expect(computeRaceBudget(world({ racePointsBudget: 4 }))).toBe(4)
  })

  it('sums fixed, repeat, tiered, and negative feature costs', () => {
    const spent = computeSpentPoints(
      [
        { id: 'armor', repeatCount: 2, parameters: {} },
        { id: 'flight', repeatCount: 1, parameters: { costTier: 4 } },
        { id: 'hindrance', repeatCount: 1, parameters: { costTier: -2 } },
      ],
      catalog,
    )

    expect(spent).toBe(4)
  })

  it('returns budget status with remaining points and validity', () => {
    const status = computeRaceBudgetStatus(
      race([{ id: 'flight', repeatCount: 1, parameters: { costTier: 4 } }]),
      world({ racePointsBudget: 2 }),
      catalog,
    )

    expect(status).toEqual({
      budget: 2,
      spent: 4,
      remaining: -2,
      isValid: false,
    })
  })

  it('computes size from selected size abilities', () => {
    expect(computeSizeFromAbilities([
      { id: 'size-plus-1', repeatCount: 3, parameters: {} },
      { id: 'size-minus-1', repeatCount: 1, parameters: {} },
    ])).toBe(2)
  })
})
