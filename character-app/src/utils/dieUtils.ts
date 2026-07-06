import type { DieName } from '@/types/character'

// Full die progression including above-d12 values for racial attribute bonuses.
// d12+1 and d12+2 are display-only effective values — never stored in base character.
const DIE_ORDER: DieName[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd12+1', 'd12+2']

/**
 * Advances a die by `steps` positions in the die order.
 * Caps at d12+2. Returns the die unchanged for unknown values (including '').
 */
export function advanceDie(die: DieName, steps: number): DieName {
  if (steps === 0) return die
  const idx = DIE_ORDER.indexOf(die)
  if (idx < 0) return die
  return DIE_ORDER[Math.min(idx + steps, DIE_ORDER.length - 1)]
}

/**
 * Regresses a die by `steps` positions in the die order.
 * Floors at d4. Returns the die unchanged for unknown values (including '').
 */
export function recessDie(die: DieName, steps: number): DieName {
  if (steps === 0) return die
  const idx = DIE_ORDER.indexOf(die)
  if (idx < 0) return die
  return DIE_ORDER[Math.max(idx - steps, 0)]
}
