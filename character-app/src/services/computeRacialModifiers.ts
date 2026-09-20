import type { AttributeKey } from '@/types/character'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { RacialAbilityMechanicalEffect } from '@/types/handbook'
import type { RacialAbilityRef } from '@/world/types'

export interface RacialModifiers {
  /** Total pace bonus (positive) or penalty (negative). `pace` ability contributes +2 per repeatCount. */
  paceBonus: number
  /** Total parry bonus/penalty. `parry` adds, `weak-parry` subtracts. */
  parryBonus: number
  /** Total toughness bonus/penalty from `tough` (adds) and `fragile` (subtracts). */
  toughnessBonus: number
  /** Total armor bonus from `armor` ability (+2 per repeatCount). Applied to both total and parentheses. */
  armorBonus: number
  /** Running-die changes from permanent racial effects. */
  runningDieSteps: number
  /**
   * Per-attribute die step adjustments.
   * Positive = advance die; negative = recess die.
   * `size-plus-1` / `size-minus-1` are intentionally excluded; size is derived separately.
   */
  attributeSteps: Map<AttributeKey, number>
  /** Penalties that apply only to attribute checks, never to a derived stat. */
  attributeCheckPenalties: Map<AttributeKey, number>
}

function repeatCount(ref: RacialAbilityRef): number {
  return Math.max(1, ref.repeatCount ?? 1)
}

function effectAmount(effect: RacialAbilityMechanicalEffect, ref: RacialAbilityRef): number {
  const costTier = ref.parameters?.costTier
  if (typeof costTier === 'number' && 'amountByCost' in effect) {
    return effect.amountByCost?.[costTier] ?? effect.amount
  }
  return effect.amount
}

/**
 * Computes the numeric stat modifiers that a set of racial abilities applies to a character.
 *
 * Design note: `size-plus-1` and `size-minus-1` are intentionally excluded from the modifier bag.
 * Size is derived separately via `computeSizeFromAbilities`, then applied once to effective size
 * and Toughness.
 */
export function computeRacialModifiers(
  abilityRefs: RacialAbilityRef[],
  catalog: ResolvedRacialAbility[],
): RacialModifiers {
  const modifiers: RacialModifiers = {
    paceBonus: 0,
    parryBonus: 0,
    toughnessBonus: 0,
    armorBonus: 0,
    runningDieSteps: 0,
    attributeSteps: new Map(),
    attributeCheckPenalties: new Map(),
  }

  const catalogById = new Map(catalog.map(a => [a.id, a]))

  for (const ref of abilityRefs) {
    const ability = catalogById.get(ref.id)
    const count = repeatCount(ref)
    for (const effect of ability?.effects ?? []) {
      const amount = effectAmount(effect, ref) * count
      switch (effect.type) {
        case 'pace':
          modifiers.paceBonus += amount
          modifiers.runningDieSteps += (effect.runningDieSteps ?? 0) * count
          break
        case 'parry':
          modifiers.parryBonus += amount
          break
        case 'toughness':
          modifiers.toughnessBonus += amount
          break
        case 'armor':
          modifiers.armorBonus += amount
          break
        case 'attribute-die-step': {
          const attribute = ref.parameters?.[effect.attributeParameter] as AttributeKey | undefined
          if (attribute) {
            modifiers.attributeSteps.set(attribute, (modifiers.attributeSteps.get(attribute) ?? 0) + amount)
          }
          break
        }
        case 'attribute-check-penalty': {
          const attribute = ref.parameters?.[effect.attributeParameter] as AttributeKey | undefined
          if (attribute) {
            modifiers.attributeCheckPenalties.set(attribute, (modifiers.attributeCheckPenalties.get(attribute) ?? 0) + amount)
          }
          break
        }
        case 'recommended-size':
          break
      }
    }
  }

  return modifiers
}
