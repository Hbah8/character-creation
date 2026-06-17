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

// ---------------------------------------------------------------------------
// Base interface — shared by all handbook entry types
// ---------------------------------------------------------------------------

export interface HandbookEntry {
  id: string
  name: string
  description: string
}

// ---------------------------------------------------------------------------
// Edge requirements sub-type
// ---------------------------------------------------------------------------

export interface EdgeRequirements {
  rank?: Rank
  attributes?: Partial<Record<string, Die>>
  skills?: Partial<Record<string, Die>>
  edges?: string[]
}

// ---------------------------------------------------------------------------
// Handbook entry types
// ---------------------------------------------------------------------------

export interface Edge extends HandbookEntry {
  type: EdgeType
  wildCardOnly?: boolean
  requirements?: EdgeRequirements
}

export interface Hindrance extends HandbookEntry {
  type: HindranceType
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
}

// ---------------------------------------------------------------------------
// World handbook override types
// ---------------------------------------------------------------------------

export type HandbookSource = 'system' | 'world'

export type HandbookCategory =
  | 'edge'
  | 'hindrance'
  | 'weapon'
  | 'gear'
  | 'power'
  | 'mount'
  | 'racialAbility'

export type EdgeOverride          = { id: string; category: 'edge' }          & Partial<Omit<Edge, 'id'>>
export type HindranceOverride     = { id: string; category: 'hindrance' }     & Partial<Omit<Hindrance, 'id'>>
export type WeaponOverride        = { id: string; category: 'weapon' }        & Partial<Omit<Weapon, 'id'>>
export type GearOverride          = { id: string; category: 'gear' }          & Partial<Omit<Gear, 'id'>>
export type PowerOverride         = { id: string; category: 'power' }         & Partial<Omit<Power, 'id'>>
export type MountOverride         = { id: string; category: 'mount' }         & Partial<Omit<Mount, 'id'>>
export type RacialAbilityOverride = { id: string; category: 'racialAbility' } & Partial<Omit<RacialAbility, 'id'>>

export type HandbookOverride =
  | EdgeOverride
  | HindranceOverride
  | WeaponOverride
  | GearOverride
  | PowerOverride
  | MountOverride
  | RacialAbilityOverride

export type ResolvedEntry<T extends HandbookEntry> = T & { source: HandbookSource }
