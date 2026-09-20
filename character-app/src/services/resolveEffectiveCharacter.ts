import { DEFAULT_CHARACTER_RESOURCE_LIMITS } from '@/types/character'
import type { Character, AttributeKey, CombatModifier, DieName } from '@/types/character'
import type { World } from '@/world/types'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import { computeRacialModifiers } from './computeRacialModifiers'
import { advanceDie, recessDie } from '@/utils/dieUtils'

const ATTRIBUTE_KEYS: AttributeKey[] = ['agility', 'strength', 'smarts', 'spirit', 'vigor']

export interface ResolvedCombatStats {
  pace: number
  parry: number
  toughness: number
  armor: number
  runningDie: DieName
  size: number
  bennies: number
  maxWounds: number
  maxFatigue: number
  powerPoints: number
}

export interface ResolvedCharacter {
  source: Character
  attributes: Record<AttributeKey, DieName>
  combat: ResolvedCombatStats
}

/**
 * Separates persisted Character source data from effective attributes and derived combat values.
 *
 * CONTRACT:
 * - The input `character` is never mutated.
 * - Callers must export `source`, never resolved output.
 */
export function resolveCharacter(character: Character, world: World | null): ResolvedCharacter {
  const race = world && character.raceId
    ? world.races.find(candidate => candidate.id === character.raceId)
    : undefined
  const catalog = world ? resolveRacialAbilitiesForWorld(world.worldHandbook) : []
  const modifiers = race ? computeRacialModifiers(race.abilities, catalog) : {
    paceBonus: 0,
    parryBonus: 0,
    toughnessBonus: 0,
    armorBonus: 0,
    runningDieSteps: 0,
    attributeSteps: new Map<AttributeKey, number>(),
  }

  const attributes: Record<AttributeKey, DieName> = {
    agility: character.agility,
    strength: character.strength,
    smarts: character.smarts,
    spirit: character.spirit,
    vigor: character.vigor,
  }
  for (const attrKey of ATTRIBUTE_KEYS) {
    const steps = modifiers.attributeSteps.get(attrKey) ?? 0
    if (steps > 0) {
      attributes[attrKey] = advanceDie(character[attrKey], steps)
    }
  }

  const fighting = character.skills.find(skill => skill.skillKey === 'fighting' || skill.id === 'fighting')
  const fightingDieValue = dieValue(fighting?.die ?? '')
  const vigorDieValue = dieValue(attributes.vigor)
  const effectiveSize = (character.size ?? 0) + (race?.size ?? 0)
  const characterModifiers = sumCombatModifiers(character.combatModifiers ?? [])
  const armor = characterModifiers.armor + modifiers.armorBonus
  const pace = 6 + characterModifiers.pace + modifiers.paceBonus
  const parry = 2 + Math.floor(fightingDieValue / 2) + characterModifiers.parry + modifiers.parryBonus
  const toughness = 2 + Math.floor(vigorDieValue / 2) + effectiveSize + characterModifiers.toughness + modifiers.toughnessBonus + armor
  const runningDieSteps = characterModifiers.runningDieSteps + modifiers.runningDieSteps
  const runningDie = runningDieSteps >= 0
    ? advanceDie('d6', runningDieSteps)
    : recessDie('d6', Math.abs(runningDieSteps))
  const bennies = DEFAULT_CHARACTER_RESOURCE_LIMITS.bennies + characterModifiers.bennies
  const maxWounds = DEFAULT_CHARACTER_RESOURCE_LIMITS.maxWounds + characterModifiers.maxWounds
  const maxFatigue = DEFAULT_CHARACTER_RESOURCE_LIMITS.maxFatigue + characterModifiers.maxFatigue
  const powerPoints = DEFAULT_CHARACTER_RESOURCE_LIMITS.powerPoints + characterModifiers.powerPoints

  return {
    source: character,
    attributes,
    combat: { pace, parry, toughness, armor, runningDie, size: effectiveSize, bennies, maxWounds, maxFatigue, powerPoints },
  }
}

function dieValue(die: Character[AttributeKey]): number {
  const match = /^d(4|6|8|10|12)(?:\+(1|2))?$/.exec(die)
  if (!match) return 0
  return Number(match[1]) + Number(match[2] ?? 0)
}

function sumCombatModifiers(modifiers: CombatModifier[]) {
  return modifiers.reduce(
    (total, modifier) => ({
      pace: total.pace + (modifier.pace ?? 0),
      parry: total.parry + (modifier.parry ?? 0),
      toughness: total.toughness + (modifier.toughness ?? 0),
      armor: total.armor + (modifier.armor ?? 0),
      runningDieSteps: total.runningDieSteps + (modifier.runningDieSteps ?? 0),
      bennies: total.bennies + (modifier.bennies ?? 0),
      maxWounds: total.maxWounds + (modifier.maxWounds ?? 0),
      maxFatigue: total.maxFatigue + (modifier.maxFatigue ?? 0),
      powerPoints: total.powerPoints + (modifier.powerPoints ?? 0),
    }),
    {
      pace: 0,
      parry: 0,
      toughness: 0,
      armor: 0,
      runningDieSteps: 0,
      bennies: 0,
      maxWounds: 0,
      maxFatigue: 0,
      powerPoints: 0,
    },
  )
}
