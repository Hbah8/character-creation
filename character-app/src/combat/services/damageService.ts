import type { Combatant, CombatantStatus } from '../types'

export interface DamageResult {
  type: 'miss' | 'no_effect' | 'shaken_only' | 'wounds'
  woundsDealt: number
  willIncapacitate: boolean
  description: string
}

/**
 * SWADE damage rules:
 * - hit < parry → miss
 * - damage < toughness → no effect
 * - damage >= toughness → Shaken (if already Shaken → 1 wound instead)
 * - each 4 over toughness = +1 raise = +1 additional wound
 * - wounds > maxWounds → incapacitated
 */
export function previewDamage(
  target: Pick<Combatant, 'parry' | 'toughness' | 'statuses' | 'wounds' | 'maxWounds'>,
  hit: number,
  damage: number,
): DamageResult {
  if (hit < target.parry) {
    return { type: 'miss', woundsDealt: 0, willIncapacitate: false, description: 'Промах' }
  }

  if (damage < target.toughness) {
    return { type: 'no_effect', woundsDealt: 0, willIncapacitate: false, description: 'Нет эффекта' }
  }

  const excess = damage - target.toughness
  const raises = Math.floor(excess / 4)
  const alreadyShaken = target.statuses.includes('shaken')

  // Already Shaken + another shaken-result → 1 wound
  const woundsDealt = raises + (alreadyShaken ? 1 : 0)
  const willIncapacitate = target.wounds + woundsDealt > target.maxWounds

  if (woundsDealt === 0) {
    return { type: 'shaken_only', woundsDealt: 0, willIncapacitate: false, description: 'Шок' }
  }

  const incapSuffix = willIncapacitate ? ' → При смерти!' : ''
  const prefix = alreadyShaken ? '' : 'Шок + '
  const woundWord = woundsDealt === 1 ? 'рана' : woundsDealt < 5 ? 'раны' : 'ран'

  return {
    type: 'wounds',
    woundsDealt,
    willIncapacitate,
    description: `${prefix}${woundsDealt} ${woundWord}${incapSuffix}`,
  }
}

export function buildDamagePatch(target: Combatant, result: DamageResult): Partial<Combatant> {
  if (result.type === 'miss' || result.type === 'no_effect') return {}

  const newStatuses = new Set<CombatantStatus>(target.statuses)
  newStatuses.add('shaken')

  const newWounds = Math.min(target.maxWounds + 1, target.wounds + result.woundsDealt)
  if (newWounds > target.maxWounds) {
    newStatuses.add('incapacitated')
  }

  return {
    wounds: newWounds,
    statuses: [...newStatuses],
  }
}
