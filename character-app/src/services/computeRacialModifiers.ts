import type { AttributeKey } from '@/types/character'
import { resolveRacialAbilityPointCost } from '@/racebuilder/services/raceBudget'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
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
  /**
   * Per-attribute die step adjustments.
   * Positive = advance die; negative = recess die.
   * `size-plus-1` / `size-minus-1` are intentionally excluded; size is derived separately.
   */
  attributeSteps: Map<AttributeKey, number>
}

function repeatCount(ref: RacialAbilityRef): number {
  return Math.max(1, ref.repeatCount ?? 1)
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
    attributeSteps: new Map(),
  }

  const catalogById = new Map(catalog.map(a => [a.id, a]))

  for (const ref of abilityRefs) {
    const ability = catalogById.get(ref.id)
    const count = repeatCount(ref)
    const cost = resolveRacialAbilityPointCost(ref, ability)

    switch (ref.id) {
      case 'pace':
        modifiers.paceBonus += 2 * count
        break
      case 'parry':
        modifiers.parryBonus += count
        break
      case 'weak-parry':
        modifiers.parryBonus -= count
        break
      case 'tough':
        modifiers.toughnessBonus += count
        break
      case 'fragile':
        modifiers.toughnessBonus -= count
        break
      case 'armor':
        modifiers.armorBonus += 2 * count
        break
      case 'attribute-bonus': {
        const attrId = (ref.parameters?.attributeId ?? '') as AttributeKey
        if (attrId) {
          modifiers.attributeSteps.set(attrId, (modifiers.attributeSteps.get(attrId) ?? 0) + count)
        }
        break
      }
      case 'attribute-penalty': {
        const attrId = (ref.parameters?.attributeId ?? '') as AttributeKey
        if (attrId) {
          // cost <= -3 means a severe penalty (-2 die steps), otherwise -1 die step
          const penalty = cost <= -3 ? 2 : 1
          modifiers.attributeSteps.set(attrId, (modifiers.attributeSteps.get(attrId) ?? 0) - penalty)
        }
        break
      }
      // size-plus-1 and size-minus-1: intentionally not handled; see module docstring.
    }
  }

  return modifiers
}
