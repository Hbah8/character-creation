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
}
