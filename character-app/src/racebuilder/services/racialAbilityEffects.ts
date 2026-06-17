import { resolveRacialAbilityPointCost } from '@/racebuilder/services/raceBudget'
import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { FeatureParameters } from '@/types/handbook'
import type { RacialAbilityRef } from '@/world/types'

export type RacialAbilityEffectCategory =
  | 'traits'
  | 'skills'
  | 'combat'
  | 'movement'
  | 'senses'
  | 'durability'
  | 'physiology'
  | 'powers'
  | 'social'
  | 'drawbacks'
  | 'other'

export type RacialAbilityEffectPolarity = 'bonus' | 'penalty' | 'mixed' | 'neutral'

export interface RacialAbilityEffect {
  id: string
  category: RacialAbilityEffectCategory
  polarity: RacialAbilityEffectPolarity
  messageKey: string
  values?: Record<string, number | string>
}

export interface RacialAbilityEffectLabels {
  attribute: (id: string) => string
  skill: (id: string) => string
  edge: (id: string) => string
  hindrance: (id: string) => string
  environment: (parameters: FeatureParameters) => string
  target: (parameters: FeatureParameters) => string
}

const CORE_SKILLS = new Set([
  'athletics',
  'common-knowledge',
  'notice',
  'persuasion',
  'stealth',
])

function repeatCount(ref: RacialAbilityRef): number {
  return Math.max(1, ref.repeatCount ?? 1)
}

function parameterString(parameters: FeatureParameters, key: string): string | null {
  const value = parameters[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function pointCost(ref: RacialAbilityRef, ability?: ResolvedRacialAbility): number {
  return resolveRacialAbilityPointCost(ref, ability)
}

function effect(
  id: string,
  category: RacialAbilityEffectCategory,
  polarity: RacialAbilityEffectPolarity,
  messageKey: string,
  values?: Record<string, number | string>,
): RacialAbilityEffect {
  return { id, category, polarity, messageKey, values }
}

function selectedAttribute(parameters: FeatureParameters, labels: RacialAbilityEffectLabels): string {
  return labels.attribute(parameterString(parameters, 'attributeId') ?? 'unknown')
}

function selectedSkill(parameters: FeatureParameters, labels: RacialAbilityEffectLabels): string {
  return labels.skill(parameterString(parameters, 'skillId') ?? 'unknown')
}

function selectedEdge(parameters: FeatureParameters, labels: RacialAbilityEffectLabels): string {
  return labels.edge(parameterString(parameters, 'edgeId') ?? 'unknown')
}

function selectedHindrance(parameters: FeatureParameters, labels: RacialAbilityEffectLabels): string {
  return labels.hindrance(parameterString(parameters, 'hindranceId') ?? 'unknown')
}

function skillDie(parameters: FeatureParameters, cost: number): string {
  const skillId = parameterString(parameters, 'skillId')
  if (cost >= 2) return 'd6'
  return skillId && CORE_SKILLS.has(skillId) ? 'd6' : 'd4'
}

function clawProfile(strength: string, cost: number): string {
  if (cost >= 4) return `${strength}+d6, AP 2`
  if (cost >= 3) return `${strength}+d6 / ${strength}+d4, AP 2`
  return `${strength}+d4`
}

function flightPace(cost: number): number {
  if (cost >= 6) return 24
  if (cost >= 4) return 12
  return 6
}

function ordinarySkillPenalty(cost: number): number {
  return cost <= -2 ? -2 : -1
}

function rareSkillPenalty(cost: number): number {
  return cost <= -2 ? -4 : -2
}

function attributePenalty(cost: number): number {
  return cost <= -3 ? -2 : -1
}

export function buildRacialAbilityEffects(
  ref: RacialAbilityRef,
  ability: ResolvedRacialAbility | undefined,
  labels: RacialAbilityEffectLabels,
): RacialAbilityEffect[] {
  const parameters = ref.parameters ?? {}
  const count = repeatCount(ref)
  const cost = pointCost(ref, ability)
  const strength = labels.attribute('strength')

  switch (ref.id) {
    case 'no-vital-organs':
      return [effect(ref.id, 'combat', 'bonus', 'calledShotVitalImmunity')]
    case 'armor':
      return [effect(ref.id, 'durability', 'bonus', 'armor', { amount: 2 * count })]
    case 'aquatic':
      return [
        cost >= 2
          ? effect(ref.id, 'movement', 'bonus', 'aquaticFull')
          : effect(ref.id, 'movement', 'bonus', 'aquaticHalf'),
      ]
    case 'attribute-bonus':
      return [
        effect(ref.id, 'traits', 'bonus', 'attributeBonus', {
          attribute: selectedAttribute(parameters, labels),
          steps: count,
        }),
      ]
    case 'reach':
      return [
        effect(ref.id, 'combat', 'bonus', 'reach', {
          target: labels.target(parameters),
          amount: count,
        }),
      ]
    case 'parry':
      return [effect(ref.id, 'combat', 'bonus', 'parryBonus', { amount: count })]
    case 'bite':
      return [effect(ref.id, 'combat', 'bonus', 'naturalWeapon', { damage: `${strength}+d4` })]
    case 'construct':
      return [
        effect(ref.id, 'durability', 'bonus', 'shakenRecoveryBonus', { amount: 2 }),
        effect(ref.id, 'physiology', 'bonus', 'poisonDiseaseImmunity'),
        effect(ref.id, 'physiology', 'bonus', 'doesNotBreathe'),
        effect(ref.id, 'durability', 'bonus', 'ignoreWoundPenalty', { amount: 1 }),
        effect(ref.id, 'drawbacks', 'penalty', 'repairHealingOnly'),
      ]
    case 'claws':
      return [effect(ref.id, 'combat', 'bonus', 'naturalWeapon', { damage: clawProfile(strength, cost) })]
    case 'reduced-sleep':
      return [
        count >= 2
          ? effect(ref.id, 'physiology', 'bonus', 'noSleepNeeded')
          : effect(ref.id, 'physiology', 'bonus', 'halfSleepNeeded'),
      ]
    case 'hardy':
      return [effect(ref.id, 'durability', 'bonus', 'hardy')]
    case 'arcane-power':
      return [
        effect(ref.id, 'powers', 'bonus', 'arcanePower', {
          powers: Math.max(1, cost - 1),
          detail: labels.target(parameters),
        }),
      ]
    case 'multi-action':
      return [effect(ref.id, 'combat', 'bonus', 'multiActionPenaltyReduction', { amount: 2 })]
    case 'skill':
      return [
        effect(ref.id, 'skills', 'bonus', 'skillDie', {
          skill: selectedSkill(parameters, labels),
          die: skillDie(parameters, cost),
        }),
      ]
    case 'poison-disease-immunity':
      return [
        count >= 2
          ? effect(ref.id, 'physiology', 'bonus', 'poisonAndDiseaseImmunity')
          : effect(ref.id, 'physiology', 'bonus', 'typedImmunity', { target: labels.target(parameters) }),
      ]
    case 'does-not-breathe':
      return [effect(ref.id, 'physiology', 'bonus', 'doesNotBreathe')]
    case 'burrowing':
      return [effect(ref.id, 'movement', 'bonus', 'burrowing')]
    case 'flight':
      return [
        effect(ref.id, 'movement', 'bonus', 'flight', {
          pace: flightPace(cost),
          running: cost >= 6 ? '2d6' : 'd6',
        }),
      ]
    case 'skill-bonus':
      return [
        effect(ref.id, 'skills', 'bonus', 'skillBonus', {
          skill: selectedSkill(parameters, labels),
          amount: cost,
        }),
      ]
    case 'jumper':
      return [effect(ref.id, 'movement', 'bonus', 'jumper')]
    case 'size-plus-1':
      return [effect(ref.id, 'traits', 'bonus', 'sizeBonus', { amount: count })]
    case 'diverse-development':
      return [
        effect(ref.id, 'skills', 'bonus', 'noviceEdgeWithRequirements', {
          edge: selectedEdge(parameters, labels),
        }),
      ]
    case 'regeneration':
      return [
        cost >= 3
          ? effect(ref.id, 'durability', 'bonus', 'regenerationWithInjuries')
          : effect(ref.id, 'durability', 'bonus', 'regeneration'),
      ]
    case 'horns':
      return [
        effect(ref.id, 'combat', 'bonus', 'naturalWeapon', {
          damage: cost >= 2 ? `${strength}+d6` : `${strength}+d4`,
        }),
      ]
    case 'tough':
      return [effect(ref.id, 'durability', 'bonus', 'toughnessBonus', { amount: count })]
    case 'low-light-vision':
      return [effect(ref.id, 'senses', 'bonus', 'lowLightVision')]
    case 'super-powers':
      return [
        effect(ref.id, 'powers', 'bonus', 'superPowers', {
          pool: Math.max(0, cost - 2),
          detail: labels.target(parameters),
        }),
      ]
    case 'infravision':
      return [effect(ref.id, 'senses', 'bonus', 'infravision')]
    case 'resistance':
      return [
        effect(ref.id, 'durability', 'bonus', 'resistance', {
          environment: labels.environment(parameters),
        }),
      ]
    case 'wall-walker':
      return [effect(ref.id, 'movement', 'bonus', 'wallWalker')]
    case 'edge':
      return [
        effect(ref.id, 'skills', 'bonus', 'edgeWithoutRequirements', {
          edge: selectedEdge(parameters, labels),
        }),
      ]
    case 'pace':
      return [
        effect(ref.id, 'movement', 'bonus', 'paceBonus', {
          pace: 2 * count,
          runningSteps: count,
        }),
      ]
    case 'venomous-touch':
      return [
        cost >= 3
          ? effect(ref.id, 'combat', 'mixed', 'venomousTouchAdvanced')
          : effect(ref.id, 'combat', 'bonus', 'venomousTouch'),
      ]
    case 'mute':
      return [effect(ref.id, 'drawbacks', 'penalty', 'mute')]
    case 'dependency':
      return [
        effect(ref.id, 'drawbacks', 'penalty', 'dependency', {
          target: labels.target(parameters),
        }),
      ]
    case 'hindrance':
      return [
        effect(ref.id, 'drawbacks', 'penalty', 'hindrance', {
          hindrance: selectedHindrance(parameters, labels),
          severity: parameters.isMajor === true ? 'Major' : 'Minor',
        }),
      ]
    case 'short-pace':
      return [
        cost <= -2
          ? effect(ref.id, 'movement', 'penalty', 'shortPaceMajor')
          : effect(ref.id, 'movement', 'penalty', 'shortPaceMinor'),
      ]
    case 'big':
      return [effect(ref.id, 'drawbacks', 'penalty', 'big')]
    case 'interspecies-enmity':
      return [
        effect(ref.id, 'social', 'penalty', 'interspeciesEnmity', {
          target: labels.target(parameters),
        }),
      ]
    case 'fewer-core-skills':
      return [
        effect(ref.id, 'skills', 'penalty', 'fewerCoreSkills', {
          skill: selectedSkill(parameters, labels),
        }),
      ]
    case 'size-minus-1':
      return [effect(ref.id, 'traits', 'penalty', 'sizePenalty', { amount: count })]
    case 'weak-parry':
      return [effect(ref.id, 'combat', 'penalty', 'parryPenalty', { amount: count })]
    case 'vulnerability':
      return [
        effect(ref.id, 'durability', 'penalty', 'vulnerability', {
          environment: labels.environment(parameters),
        }),
      ]
    case 'fragile':
      return [effect(ref.id, 'durability', 'penalty', 'toughnessPenalty', { amount: count })]
    case 'skill-penalty':
      return [
        effect(ref.id, 'skills', 'penalty', 'skillPenalty', {
          skill: selectedSkill(parameters, labels),
          ordinary: ordinarySkillPenalty(cost),
          rare: rareSkillPenalty(cost),
        }),
      ]
    case 'attribute-penalty':
      const isStrengthPenalty = parameterString(parameters, 'attributeId') === 'strength'
      return [
        effect(ref.id, 'traits', 'penalty', isStrengthPenalty ? 'attributePenaltyStrength' : 'attributePenalty', {
          attribute: selectedAttribute(parameters, labels),
          penalty: attributePenalty(cost),
        }),
      ]
    default:
      return [
        effect(ref.id, 'other', ability?.type === 'negative' ? 'penalty' : 'neutral', 'customAbility'),
      ]
  }
}

export function buildRaceEffectSummary(
  abilities: RacialAbilityRef[],
  catalog: ResolvedRacialAbility[],
  labels: RacialAbilityEffectLabels,
): RacialAbilityEffect[] {
  const catalogById = new Map(catalog.map(ability => [ability.id, ability]))

  return abilities.flatMap(ref =>
    buildRacialAbilityEffects(ref, catalogById.get(ref.id), labels)
  )
}
