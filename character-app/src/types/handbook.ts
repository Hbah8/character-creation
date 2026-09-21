// ---------------------------------------------------------------------------
// Supporting literal types
// ---------------------------------------------------------------------------

export type Rank = 'Novice' | 'Seasoned' | 'Veteran' | 'Heroic' | 'Legendary'

export type Die = 'd4' | 'd6' | 'd8' | 'd10' | 'd12'

export type EdgeType =
  | 'Background'
  | 'Combat'
  | 'Leadership'
  | 'Power'
  | 'Professional'
  | 'Social'
  | 'Weird'
  | 'WildCard'

export type HindranceType = 'Major' | 'Minor'

export type WeaponCategory = 'Melee' | 'Ranged' | 'Thrown' | 'Unarmed'

export type GearCategory = 'Adventuring' | 'Clothing' | 'Food' | 'Tools' | 'Other'

export type MountCategory = 'animal' | 'vehicle'

export type RacialAbilityType = 'positive' | 'negative'

export type ArcaneBackground =
  | 'Magic'
  | 'Miracles'
  | 'Psionics'
  | 'SuperPowers'
  | 'WeirdScience'

export type RacialAbilityMaxRepeat = number | 'unlimited'

export type FeatureParameters = Record<string, unknown>

interface BaseFeatureParameterSchema {
  key: string
  labelKey: string
  required?: boolean
}

export type FeatureParameterSchema =
  | (BaseFeatureParameterSchema & { type: 'attribute-picker' })
  | (BaseFeatureParameterSchema & { type: 'skill-picker' })
  | (BaseFeatureParameterSchema & { type: 'cost-tier' })
  | (BaseFeatureParameterSchema & { type: 'freetext'; placeholderKey?: string })
  | (BaseFeatureParameterSchema & { type: 'hindrance-ref' })
  | (BaseFeatureParameterSchema & { type: 'edge-ref' })
  | (BaseFeatureParameterSchema & { type: 'environment-type' })

export type RacialAbilityMechanicalEffect =
  | { type: 'attribute-die-step'; attributeParameter: string; amount: number }
  | { type: 'attribute-check-penalty'; attributeParameter: string; amount: number; amountByCost?: Record<number, number> }
  | { type: 'pace'; amount: number; amountByCost?: Record<number, number>; runningDieSteps?: number }
  | { type: 'parry'; amount: number }
  | { type: 'toughness'; amount: number }
  | { type: 'armor'; amount: number }
  | { type: 'recommended-size'; amount: number }

// ---------------------------------------------------------------------------
// Base interface — shared by all handbook entry types
// ---------------------------------------------------------------------------

export interface HandbookEntry {
  id: string
  name: string
  description: string
}

export interface SkillDefinition extends HandbookEntry {
  linkedAttribute: AttributeKey
  isCore: boolean
}

// ---------------------------------------------------------------------------
// Edge requirements sub-type
// ---------------------------------------------------------------------------

export type AttributeKey = 'agility' | 'smarts' | 'spirit' | 'strength' | 'vigor'

export type ArcaneBackgroundRequirement =
  | 'any'
  | 'weirdScience'
  | 'magic'
  | 'psionics'
  | 'gifted'
  | 'miracles'

export type EdgeRequirementCondition =
  | { type: 'rank'; minimum: Rank }
  | { type: 'attribute'; attribute: AttributeKey; minimum: Die }
  | { type: 'skill'; skill: string; minimum: Die }
  | { type: 'edge'; edgeId: string; arcaneBackground?: ArcaneBackgroundRequirement }
  | { type: 'hindrance'; hindranceId: string }
  | { type: 'race'; raceId: string }
  | { type: 'wildCard' }
  | { type: 'text'; text: string }

export type EdgeRequirement = EdgeRequirementCondition | { anyOf: EdgeRequirementCondition[] }

export interface EdgeRequirements {
  allOf: EdgeRequirement[]
}

// ---------------------------------------------------------------------------
// Handbook entry types
// ---------------------------------------------------------------------------

export interface Edge extends HandbookEntry {
  type: EdgeType
  wildCardOnly?: boolean
  requirements?: EdgeRequirements
  modifiers?: HandbookModifier[]
}

export interface Hindrance extends HandbookEntry {
  type: HindranceType
  modifiers?: HandbookModifier[]
}

export interface Weapon extends HandbookEntry {
  category: WeaponCategory
  damage: string
  range?: string
  ap?: number
  rof?: number
  weight?: number
  cost?: number
}

export interface Gear extends HandbookEntry {
  category: GearCategory
  weight?: number
  cost?: number
}

export interface Power extends HandbookEntry {
  arcaneBackground: ArcaneBackground[]
  ppCost: string
  range: string
  duration: string
}

export interface Mount extends HandbookEntry {
  category: MountCategory
  toughness: number
  pace?: number
  handling?: number
  cost?: number
}

export interface RacialAbility extends HandbookEntry {
  type: RacialAbilityType
  points?: number
  pointCostOptions?: number[]
  maxRepeat?: RacialAbilityMaxRepeat
  parameterSchema?: FeatureParameterSchema[]
  effects?: RacialAbilityMechanicalEffect[]
  modifiers?: HandbookModifier[]
}

// ---------------------------------------------------------------------------
// World handbook override types
// ---------------------------------------------------------------------------

export type HandbookSource = 'system' | 'world'

export type HandbookCategory =
  | 'edge'
  | 'hindrance'
  | 'skill'
  | 'weapon'
  | 'gear'
  | 'power'
  | 'mount'
  | 'racialAbility'

export type HandbookCombatStat =
  | 'pace'
  | 'parry'
  | 'toughness'
  | 'armor'
  | 'runningDieSteps'
  | 'bennies'
  | 'maxWounds'
  | 'maxFatigue'
  | 'powerPoints'

export type HandbookModifier =
  | { type: 'combat'; stat: HandbookCombatStat; amount: number }
  | { type: 'attribute-die-step'; attribute: string; amount: number }

export type ModifierHandbookEntry = Edge | Hindrance | RacialAbility

export type CustomHandbookEntry<T extends HandbookEntry, Category extends HandbookCategory> =
  T & { mode: 'custom'; handbookCategory: Category }

export type HandbookEntryOverride<Category extends HandbookCategory, Entry extends HandbookEntry> =
  { mode: 'override'; id: string; handbookCategory: Category }
  & Partial<Omit<Entry, 'id'>>

export type WorldHandbookEntry =
  | CustomHandbookEntry<Edge, 'edge'>
  | CustomHandbookEntry<Hindrance, 'hindrance'>
  | CustomHandbookEntry<SkillDefinition, 'skill'>
  | CustomHandbookEntry<Weapon, 'weapon'>
  | CustomHandbookEntry<Gear, 'gear'>
  | CustomHandbookEntry<Power, 'power'>
  | CustomHandbookEntry<Mount, 'mount'>
  | CustomHandbookEntry<RacialAbility, 'racialAbility'>
  | HandbookEntryOverride<'edge', Edge>
  | HandbookEntryOverride<'hindrance', Hindrance>
  | HandbookEntryOverride<'skill', SkillDefinition>
  | HandbookEntryOverride<'weapon', Weapon>
  | HandbookEntryOverride<'gear', Gear>
  | HandbookEntryOverride<'power', Power>
  | HandbookEntryOverride<'mount', Mount>
  | HandbookEntryOverride<'racialAbility', RacialAbility>

export type EdgeOverride          = { id: string; category: 'edge' }          & Partial<Omit<Edge, 'id'>>
export type HindranceOverride     = { id: string; category: 'hindrance' }     & Partial<Omit<Hindrance, 'id'>>
export type SkillOverride          = { id: string; category: 'skill' }         & Partial<Omit<SkillDefinition, 'id'>>
export type WeaponOverride        = { id: string; category: 'weapon' }        & Partial<Omit<Weapon, 'id'>>
export type GearOverride          = { id: string; category: 'gear' }          & Partial<Omit<Gear, 'id'>>
export type PowerOverride         = { id: string; category: 'power' }         & Partial<Omit<Power, 'id'>>
export type MountOverride         = { id: string; category: 'mount' }         & Partial<Omit<Mount, 'id'>>
export type RacialAbilityOverride = { id: string; category: 'racialAbility' } & Partial<Omit<RacialAbility, 'id'>>

export type HandbookOverride =
  | EdgeOverride
  | HindranceOverride
  | SkillOverride
  | WeaponOverride
  | GearOverride
  | PowerOverride
  | MountOverride
  | RacialAbilityOverride

export type StoredHandbookEntry = HandbookOverride | WorldHandbookEntry

export type ResolvedEntry<T extends HandbookEntry> = T & { source: HandbookSource }
