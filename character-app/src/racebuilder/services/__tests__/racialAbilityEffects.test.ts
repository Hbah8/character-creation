import { describe, expect, it } from 'vitest'
import { SWADE_RACIAL_ABILITIES } from '@/data/handbooks/racialAbilities'
import {
  buildRacialAbilityEffects,
  buildRaceEffectSummary,
  type RacialAbilityEffectLabels,
} from '@/racebuilder/services/racialAbilityEffects'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityRef } from '@/world/types'

const labels: RacialAbilityEffectLabels = {
  attribute: id => id,
  skill: id => id,
  edge: id => id,
  hindrance: id => id,
  environment: parameters => String(parameters.environmentType ?? 'environment'),
  target: parameters => String(parameters.targetLabel ?? 'target'),
}

function ability(id: string): ResolvedRacialAbility | undefined {
  const item = SWADE_RACIAL_ABILITIES.find(entry => entry.id === id)
  return item ? { ...item, source: 'system' } : undefined
}

describe('racial ability effects', () => {
  it('covers every system racial ability with at least one UX effect line', () => {
    const missing = SWADE_RACIAL_ABILITIES
      .map(item => ({
        id: item.id,
        effects: buildRacialAbilityEffects(
          { id: item.id, repeatCount: 1, parameters: {} },
          { ...item, source: 'system' as const },
          labels,
        ),
      }))
      .filter(item => item.effects.length === 0)

    expect(missing).toEqual([])
  })

  it('shows the selected attribute penalty amount from the cost tier', () => {
    const effects = buildRacialAbilityEffects(
      {
        id: 'attribute-penalty',
        repeatCount: 1,
        parameters: { attributeId: 'agility', costTier: -3 },
      },
      ability('attribute-penalty'),
      labels,
    )

    expect(effects).toContainEqual(expect.objectContaining({
      messageKey: 'attributePenalty',
      values: expect.objectContaining({
        attribute: 'agility',
        penalty: -2,
      }),
    }))
  })

  it('shows the stronger strength penalty as a damage penalty too', () => {
    const effects = buildRacialAbilityEffects(
      {
        id: 'attribute-penalty',
        repeatCount: 1,
        parameters: { attributeId: 'strength', costTier: -3 },
      },
      ability('attribute-penalty'),
      labels,
    )

    expect(effects[0]).toMatchObject({
      messageKey: 'attributePenaltyStrength',
      values: expect.objectContaining({ penalty: -2 }),
    })
  })

  it('turns tiered skill bonuses and penalties into explicit modifiers', () => {
    const bonus = buildRacialAbilityEffects(
      { id: 'skill-bonus', repeatCount: 1, parameters: { skillId: 'stealth', costTier: 2 } },
      ability('skill-bonus'),
      labels,
    )
    const penalty = buildRacialAbilityEffects(
      { id: 'skill-penalty', repeatCount: 1, parameters: { skillId: 'fighting', costTier: -2 } },
      ability('skill-penalty'),
      labels,
    )

    expect(bonus[0]).toMatchObject({
      messageKey: 'skillBonus',
      values: expect.objectContaining({ amount: 2 }),
    })
    expect(penalty[0]).toMatchObject({
      messageKey: 'skillPenalty',
      values: expect.objectContaining({ ordinary: -2, rare: -4 }),
    })
  })

  it('builds a combined summary without relying on racial ability names', () => {
    const refs: RacialAbilityRef[] = [
      { id: 'size-plus-1', repeatCount: 2, parameters: {} },
      { id: 'armor', repeatCount: 1, parameters: {} },
      { id: 'vulnerability', repeatCount: 1, parameters: { environmentType: 'fire' } },
    ]

    const catalog = SWADE_RACIAL_ABILITIES.map(item => ({ ...item, source: 'system' as const }))

    expect(buildRaceEffectSummary(refs, catalog, labels)).toEqual([
      expect.objectContaining({ messageKey: 'sizeBonus', values: expect.objectContaining({ amount: 2 }) }),
      expect.objectContaining({ messageKey: 'armor', values: expect.objectContaining({ amount: 2 }) }),
      expect.objectContaining({ messageKey: 'vulnerability', values: expect.objectContaining({ environment: 'fire' }) }),
    ])
  })
})
