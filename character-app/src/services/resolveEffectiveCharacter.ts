import { DEFAULT_CHARACTER_RESOURCE_LIMITS } from '@/types/character'
import type { Character, AttributeKey, CombatModifier, DieName } from '@/types/character'
import type { World } from '@/world/types'
import { resolveRacialAbilitiesForWorld } from '@/racebuilder/services/racialAbilityOptions'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import { SWADE_EDGES } from '@/data/handbooks/edges'
import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import type { HandbookCombatStat, HandbookModifier } from '@/types/handbook'
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
  modifierBreakdown: ResolvedModifierBreakdown[]
}

export interface ResolvedModifierBreakdown {
  id: string
  source: 'edge' | 'hindrance' | 'racialAbility' | CombatModifier['source']
  name: string
  stat: HandbookCombatStat
  amount: number
}

interface ActiveHandbookModifier {
  id: string
  source: 'edge' | 'hindrance' | 'racialAbility'
  name: string
  modifier: HandbookModifier
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
  const handbookModifiers = world ? collectActiveHandbookModifiers(character, world, catalog) : []
  const handbookAttributeSteps = sumAttributeDieSteps(handbookModifiers)

  const attributes: Record<AttributeKey, DieName> = {
    agility: character.agility,
    strength: character.strength,
    smarts: character.smarts,
    spirit: character.spirit,
    vigor: character.vigor,
  }
  for (const attrKey of ATTRIBUTE_KEYS) {
    const steps = (modifiers.attributeSteps.get(attrKey) ?? 0) + (handbookAttributeSteps.get(attrKey) ?? 0)
    if (steps > 0) {
      attributes[attrKey] = advanceDie(character[attrKey], steps)
    } else if (steps < 0) {
      attributes[attrKey] = recessDie(character[attrKey], Math.abs(steps))
    }
  }

  const fighting = character.skills.find(skill => skill.skillKey === 'fighting' || skill.id === 'fighting')
  const fightingDieValue = dieValue(fighting?.die ?? '')
  const vigorDieValue = dieValue(attributes.vigor)
  const effectiveSize = (character.size ?? 0) + (race?.size ?? 0)
  const characterModifiers = sumCombatModifiers(character.combatModifiers ?? [])
  const handbookCombatModifiers = sumHandbookCombatModifiers(handbookModifiers)
  const armor = characterModifiers.armor + handbookCombatModifiers.armor + modifiers.armorBonus
  const pace = 6 + characterModifiers.pace + handbookCombatModifiers.pace + modifiers.paceBonus
  const parry = 2 + Math.floor(fightingDieValue / 2) + characterModifiers.parry + handbookCombatModifiers.parry + modifiers.parryBonus
  const toughness = 2 + Math.floor(vigorDieValue / 2) + effectiveSize + characterModifiers.toughness + handbookCombatModifiers.toughness + modifiers.toughnessBonus + armor
  const runningDieSteps = characterModifiers.runningDieSteps + handbookCombatModifiers.runningDieSteps + modifiers.runningDieSteps
  const runningDie = runningDieSteps >= 0
    ? advanceDie('d6', runningDieSteps)
    : recessDie('d6', Math.abs(runningDieSteps))
  const bennies = DEFAULT_CHARACTER_RESOURCE_LIMITS.bennies + characterModifiers.bennies + handbookCombatModifiers.bennies
  const maxWounds = DEFAULT_CHARACTER_RESOURCE_LIMITS.maxWounds + characterModifiers.maxWounds + handbookCombatModifiers.maxWounds
  const maxFatigue = DEFAULT_CHARACTER_RESOURCE_LIMITS.maxFatigue + characterModifiers.maxFatigue + handbookCombatModifiers.maxFatigue
  const powerPoints = DEFAULT_CHARACTER_RESOURCE_LIMITS.powerPoints + characterModifiers.powerPoints + handbookCombatModifiers.powerPoints

  return {
    source: character,
    attributes,
    combat: { pace, parry, toughness, armor, runningDie, size: effectiveSize, bennies, maxWounds, maxFatigue, powerPoints },
    modifierBreakdown: [
      ...toCombatModifierBreakdown(character.combatModifiers ?? []),
      ...toHandbookModifierBreakdown(handbookModifiers),
    ],
  }
}

function collectActiveHandbookModifiers(
  character: Character,
  world: World,
  racialAbilities: ReturnType<typeof resolveRacialAbilitiesForWorld>,
): ActiveHandbookModifier[] {
  const edges = resolveHandbookEntries('edge', world.worldHandbook, [...SWADE_EDGES])
  const hindrances = resolveHandbookEntries('hindrance', world.worldHandbook, [...SWADE_HINDRANCES])
  const selectedEdgeIds = new Set(character.edges.map(edge => edge.id))
  const selectedHindranceIds = new Set(character.hindrances.map(hindrance => hindrance.id))
  const active: ActiveHandbookModifier[] = []

  for (const edge of edges) {
    if (selectedEdgeIds.has(edge.id)) {
      appendModifiers(active, edge.id, 'edge', edge.name, edge.modifiers)
    }
  }
  for (const hindrance of hindrances) {
    if (selectedHindranceIds.has(hindrance.id)) {
      appendModifiers(active, hindrance.id, 'hindrance', hindrance.name, hindrance.modifiers)
    }
  }
  if (character.raceId) {
    const race = world.races.find(candidate => candidate.id === character.raceId)
    for (const ref of race?.abilities ?? []) {
      const ability = racialAbilities.find(candidate => candidate.id === ref.id)
      if (!ability) continue
      const repeatCount = Math.max(1, ref.repeatCount ?? 1)
      appendModifiers(active, ability.id, 'racialAbility', ability.name, ability.modifiers, repeatCount)
    }
  }

  return active
}

function appendModifiers(
  target: ActiveHandbookModifier[],
  id: string,
  source: ActiveHandbookModifier['source'],
  name: string,
  modifiers: HandbookModifier[] | undefined,
  repeatCount = 1,
) {
  for (const modifier of modifiers ?? []) {
    target.push({
      id,
      source,
      name,
      modifier: { ...modifier, amount: modifier.amount * repeatCount },
    })
  }
}

function sumAttributeDieSteps(modifiers: ActiveHandbookModifier[]): Map<AttributeKey, number> {
  const steps = new Map<AttributeKey, number>()
  for (const { modifier } of modifiers) {
    if (modifier.type !== 'attribute-die-step') continue
    const attribute = modifier.attribute as AttributeKey
    if (ATTRIBUTE_KEYS.includes(attribute)) {
      steps.set(attribute, (steps.get(attribute) ?? 0) + modifier.amount)
    }
  }
  return steps
}

function sumHandbookCombatModifiers(modifiers: ActiveHandbookModifier[]) {
  return modifiers.reduce(
    (total, { modifier }) => {
      if (modifier.type === 'combat') total[modifier.stat] += modifier.amount
      return total
    },
    emptyCombatModifierTotals(),
  )
}

function toHandbookModifierBreakdown(modifiers: ActiveHandbookModifier[]): ResolvedModifierBreakdown[] {
  return modifiers.flatMap(({ id, source, name, modifier }) =>
    modifier.type === 'combat'
      ? [{ id, source, name, stat: modifier.stat, amount: modifier.amount }]
      : [],
  )
}

function toCombatModifierBreakdown(modifiers: CombatModifier[]): ResolvedModifierBreakdown[] {
  const stats: HandbookCombatStat[] = [
    'pace', 'parry', 'toughness', 'armor', 'runningDieSteps',
    'bennies', 'maxWounds', 'maxFatigue', 'powerPoints',
  ]
  return modifiers.flatMap(modifier =>
    stats.flatMap(stat => {
      const amount = modifier[stat]
      return amount === undefined || amount === 0
        ? []
        : [{ id: modifier.id, source: modifier.source, name: modifier.name, stat, amount }]
    }),
  )
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
    emptyCombatModifierTotals(),
  )
}

function emptyCombatModifierTotals() {
  return {
    pace: 0,
    parry: 0,
    toughness: 0,
    armor: 0,
    runningDieSteps: 0,
    bennies: 0,
    maxWounds: 0,
    maxFatigue: 0,
    powerPoints: 0,
  }
}
