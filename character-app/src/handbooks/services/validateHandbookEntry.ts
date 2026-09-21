import type {
  ArcaneBackgroundRequirement,
  AttributeKey,
  Die,
  EdgeRequirement,
  EdgeRequirementCondition,
  EdgeRequirements,
  HandbookCategory,
  HandbookCombatStat,
  HandbookModifier,
  Rank,
  WorldHandbookEntry,
} from '@/types/handbook'

const HANDBOOK_CATEGORIES: readonly HandbookCategory[] = [
  'edge', 'hindrance', 'skill', 'weapon', 'gear', 'power', 'mount', 'racialAbility',
]

const COMBAT_STATS: readonly HandbookCombatStat[] = [
  'pace', 'parry', 'toughness', 'armor', 'runningDieSteps',
  'bennies', 'maxWounds', 'maxFatigue', 'powerPoints',
]
const RANKS = ['Novice', 'Seasoned', 'Veteran', 'Heroic', 'Legendary'] as const
const DICE = ['d4', 'd6', 'd8', 'd10', 'd12'] as const
const ATTRIBUTES = ['agility', 'smarts', 'spirit', 'strength', 'vigor'] as const
const ARCANE_BACKGROUND_REQUIREMENTS = ['any', 'weirdScience', 'magic', 'psionics', 'gifted', 'miracles'] as const
  const EDGE_TYPES = ['Background', 'Combat', 'Leadership', 'Power', 'Professional', 'Social', 'Weird', 'WildCard']
  const HINDRANCE_TYPES = ['Major', 'Minor']
  const WEAPON_CATEGORIES = ['Melee', 'Ranged', 'Thrown', 'Unarmed']
  const GEAR_CATEGORIES = ['Adventuring', 'Clothing', 'Food', 'Tools', 'Other']
  const MOUNT_CATEGORIES = ['animal', 'vehicle']
  const RACIAL_ABILITY_TYPES = ['positive', 'negative']
  const ARCANE_BACKGROUNDS = ['Magic', 'Miracles', 'Psionics', 'SuperPowers', 'WeirdScience']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHandbookCategory(value: unknown): value is HandbookCategory {
  return HANDBOOK_CATEGORIES.includes(value as HandbookCategory)
}

function hasNonEmptyId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function validateRequirementCondition(raw: unknown): EdgeRequirementCondition {
  if (!isObject(raw) || typeof raw.type !== 'string') throw new Error('validation.handbook.invalidRequirements')

  switch (raw.type) {
    case 'rank':
      if (!RANKS.includes(raw.minimum as typeof RANKS[number])) break
      return { type: 'rank', minimum: raw.minimum as Rank }
    case 'attribute':
      if (!ATTRIBUTES.includes(raw.attribute as AttributeKey) || !DICE.includes(raw.minimum as Die)) break
      return { type: 'attribute', attribute: raw.attribute as AttributeKey, minimum: raw.minimum as Die }
    case 'skill':
      if (!hasNonEmptyId(raw.skill) || !DICE.includes(raw.minimum as Die)) break
      return { type: 'skill', skill: raw.skill, minimum: raw.minimum as Die }
    case 'edge':
      if (!hasNonEmptyId(raw.edgeId)) break
      if (raw.arcaneBackground !== undefined && !ARCANE_BACKGROUND_REQUIREMENTS.includes(raw.arcaneBackground as ArcaneBackgroundRequirement)) break
      return {
        type: 'edge',
        edgeId: raw.edgeId,
        ...(raw.arcaneBackground === undefined ? {} : { arcaneBackground: raw.arcaneBackground as ArcaneBackgroundRequirement }),
      }
    case 'hindrance':
      if (!hasNonEmptyId(raw.hindranceId)) break
      return { type: 'hindrance', hindranceId: raw.hindranceId }
    case 'race':
      if (!hasNonEmptyId(raw.raceId)) break
      return { type: 'race', raceId: raw.raceId }
    case 'wildCard':
      return { type: 'wildCard' }
    case 'text':
      if (!hasNonEmptyId(raw.text)) break
      return { type: 'text', text: raw.text }
  }

  throw new Error('validation.handbook.invalidRequirements')
}

function validateEdgeRequirements(raw: unknown): EdgeRequirements | undefined {
  if (raw === undefined) return undefined
  if (!isObject(raw) || !Array.isArray(raw.allOf) || raw.allOf.length === 0) {
    throw new Error('validation.handbook.invalidRequirements')
  }

  const allOf: EdgeRequirement[] = raw.allOf.map(requirement => {
    if (isObject(requirement) && Array.isArray(requirement.anyOf)) {
      if (requirement.anyOf.length === 0) throw new Error('validation.handbook.invalidRequirements')
      return { anyOf: requirement.anyOf.map(validateRequirementCondition) }
    }
    return validateRequirementCondition(requirement)
  })

  return { allOf }
}

function validateModifiers(raw: unknown): HandbookModifier[] | undefined {
  if (raw === undefined) return undefined
  if (!Array.isArray(raw)) throw new Error('validation.handbook.invalidModifiers')

  return raw.map((modifier, index) => {
    if (!isObject(modifier) || typeof modifier.type !== 'string' || typeof modifier.amount !== 'number') {
      throw new Error(`validation.handbook.invalidModifier:${index}`)
    }
    if (modifier.type === 'combat') {
      if (!COMBAT_STATS.includes(modifier.stat as HandbookCombatStat)) {
        throw new Error('validation.handbook.invalidModifierStat')
      }
      return { type: 'combat', stat: modifier.stat as HandbookCombatStat, amount: modifier.amount }
    }
    if (modifier.type === 'attribute-die-step' && typeof modifier.attribute === 'string' && modifier.attribute !== '') {
      return { type: 'attribute-die-step', attribute: modifier.attribute, amount: modifier.amount }
    }
    throw new Error(`validation.handbook.invalidModifier:${index}`)
  })
}

export function validateHandbookEntry(raw: unknown): WorldHandbookEntry {
  if (!isObject(raw)) throw new Error('validation.handbook.notAnObject')
  if (raw.mode !== 'custom' && raw.mode !== 'override') {
    throw new Error('validation.handbook.invalidMode')
  }
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    throw new Error('validation.handbook.invalidId')
  }
  if (!isHandbookCategory(raw.handbookCategory)) {
    throw new Error('validation.handbook.invalidCategory')
  }

  const modifiers = validateModifiers(raw.modifiers)
  const requirements = raw.handbookCategory === 'edge'
    ? validateEdgeRequirements(raw.requirements)
    : undefined
  if (
    modifiers
    && raw.handbookCategory !== 'edge'
    && raw.handbookCategory !== 'hindrance'
    && raw.handbookCategory !== 'racialAbility'
  ) {
    throw new Error('validation.handbook.modifiersNotSupported')
  }
  if (raw.mode === 'override') {
    return { ...raw, modifiers, ...(requirements ? { requirements } : {}) } as WorldHandbookEntry
  }
  if (typeof raw.name !== 'string' || typeof raw.description !== 'string') {
    throw new Error('validation.handbook.missingRequiredField')
  }
    validateCustomCategoryFields(raw)

  return { ...raw, modifiers, ...(requirements ? { requirements } : {}) } as WorldHandbookEntry
}

  function isOneOf(value: unknown, values: readonly string[]): value is string {
    return typeof value === 'string' && values.includes(value)
  }

  function isStringArray(value: unknown, allowedValues?: readonly string[]): value is string[] {
    return Array.isArray(value)
      && value.every(item => typeof item === 'string' && (!allowedValues || allowedValues.includes(item)))
  }

  function validateCustomCategoryFields(raw: Record<string, unknown>) {
    switch (raw.handbookCategory) {
      case 'edge':
        if (!isOneOf(raw.type, EDGE_TYPES)) throw new Error('validation.handbook.missingRequiredField')
        return
      case 'hindrance':
        if (!isOneOf(raw.type, HINDRANCE_TYPES)) throw new Error('validation.handbook.missingRequiredField')
        return
      case 'skill':
        if (!isOneOf(raw.linkedAttribute, ATTRIBUTES) || typeof raw.isCore !== 'boolean') {
          throw new Error('validation.handbook.missingRequiredField')
        }
        return
      case 'weapon':
        if (!isOneOf(raw.category, WEAPON_CATEGORIES) || typeof raw.damage !== 'string') {
          throw new Error('validation.handbook.missingRequiredField')
        }
        return
      case 'gear':
        if (!isOneOf(raw.category, GEAR_CATEGORIES)) throw new Error('validation.handbook.missingRequiredField')
        return
      case 'power':
        if (
          !isStringArray(raw.arcaneBackground, ARCANE_BACKGROUNDS)
          || typeof raw.ppCost !== 'string'
          || typeof raw.range !== 'string'
          || typeof raw.duration !== 'string'
        ) {
          throw new Error('validation.handbook.missingRequiredField')
        }
        return
      case 'mount':
        if (!isOneOf(raw.category, MOUNT_CATEGORIES) || typeof raw.toughness !== 'number') {
          throw new Error('validation.handbook.missingRequiredField')
        }
        return
      case 'racialAbility':
        if (!isOneOf(raw.type, RACIAL_ABILITY_TYPES)) throw new Error('validation.handbook.missingRequiredField')
    }
  }