import type { Character, AttributeKey } from '@/types/character'
import type { World } from '@/world/types'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import { computeSizeFromAbilities } from '@/racebuilder/services/raceBudget'
import { computeRacialModifiers } from './computeRacialModifiers'
import { advanceDie, recessDie } from '@/utils/dieUtils'
import { parseToughness, formatToughness } from '@/utils/toughnessUtils'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

/**
 * Builds an effective `Character` for preview and PDF rendering by applying racial stat modifiers
 * to the base character values.
 *
 * CONTRACT:
 * - The input `character` is never mutated.
 * - The base `character` must be used for JSON export; only the result of this function
 *   should be passed to the preview/PDF pipeline.
 * - Returns the base `character` reference unchanged when there is no world or no valid race.
 * - Unparseable string fields (pace, parry, toughness) are left verbatim.
 */
export function resolveEffectiveCharacter(character: Character, world: World | null): Character {
  if (!world || !character.raceId) return character

  const race = world.races.find(r => r.id === character.raceId)
  if (!race) return character

  const catalog = resolveRacialAbilitiesForWorld(world.worldHandbook)
  const modifiers = computeRacialModifiers(race.abilities, catalog)
  const raceSize = computeSizeFromAbilities(race.abilities)
  const effectiveSize = (character.size ?? 0) + raceSize

  let result: Character = { ...character }

  // ── Pace ──────────────────────────────────────────────────────────────────
  if (modifiers.paceBonus !== 0) {
    const basePace = parseInt(character.pace, 10)
    if (!isNaN(basePace)) {
      result = { ...result, pace: String(basePace + modifiers.paceBonus) }
    }
  }

  // ── Parry ─────────────────────────────────────────────────────────────────
  if (modifiers.parryBonus !== 0) {
    const baseParry = parseInt(character.parry, 10)
    if (!isNaN(baseParry)) {
      result = { ...result, parry: String(baseParry + modifiers.parryBonus) }
    }
  }

  // ── Toughness + Armor ─────────────────────────────────────────────────────
  // Formula:
  //   total += effectiveSize + toughnessBonus + armorBonus
  //   armor += armorBonus only
  if (effectiveSize !== 0 || modifiers.toughnessBonus !== 0 || modifiers.armorBonus !== 0) {
    const parsed = parseToughness(character.toughness)
    if (parsed !== null) {
      const newBase = parsed.base + effectiveSize + modifiers.toughnessBonus + modifiers.armorBonus
      const newArmor = parsed.armor + modifiers.armorBonus
      result = { ...result, toughness: formatToughness(newBase, newArmor) }
    }
    // If unparseable, leave toughness as-is
  }

  // ── Effective Size ────────────────────────────────────────────────────────
  // effectiveSize = character.size (non-racial size modifiers, default 0) + size derived from racial abilities.
  result = { ...result, size: effectiveSize }

  // ── Attribute Die Steps ───────────────────────────────────────────────────
  for (const attrKey of ATTRIBUTE_KEYS) {
    const steps = modifiers.attributeSteps.get(attrKey) ?? 0
    if (steps !== 0) {
      const currentDie = character[attrKey]
      const newDie = steps > 0
        ? advanceDie(currentDie, steps)
        : recessDie(currentDie, -steps)
      result = { ...result, [attrKey]: newDie }
    }
  }

  return result
}
