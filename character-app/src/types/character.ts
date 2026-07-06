// d12+1 and d12+2 represent above-maximum attribute values granted by racial bonuses.
// The app hard-caps display at d12+2. These values are only used in the effective character
// model (preview/PDF) — they are never stored in the base character or shown in form pickers.
export type DieName = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd12+1' | 'd12+2' | ''

export type AttributeKey = 'agility' | 'strength' | 'smarts' | 'spirit' | 'vigor'

export interface Skill {
  id: string
  name: string
  die: DieName
  linkedAttribute: AttributeKey
  isStarter?: boolean
}

export interface Edge {
  id: string
  name: string
  effect: string
}

export type HindranceSeverity = 'minor' | 'major'

export interface Hindrance {
  id: string
  name: string
  severity: HindranceSeverity
  description: string
}

export interface Weapon {
  id: string
  name: string
  range: string
  damage: string
  ap: string
  rof: string
  magazine: string
}

export interface SpecialRule {
  id: string
  name: string
  description: string
}

export interface PowerModifier {
  id: string
  name: string
  ppCost: string
}

export interface CharacterPower {
  id: string
  name: string
  ppCost: string
  range: string
  duration: string
  description: string
  modifiers: PowerModifier[]
}

export type ColumnSide = 'left' | 'right'

export interface CharacterLayout {
  weapons: ColumnSide
  edges: ColumnSide
  hindrances: ColumnSide
  gear: ColumnSide
  specialRules: ColumnSide
  powers: ColumnSide
}

export const DEFAULT_LAYOUT: CharacterLayout = {
  weapons: 'left',
  edges: 'right',
  hindrances: 'right',
  gear: 'right',
  specialRules: 'right',
  powers: 'right',
}

export interface Character {
  // Identity
  sheetTitle: string
  callsign: string
  name: string
  rank: string
  role: string
  fileNo: string
  portraitUrl: string

  // Attributes
  agility: DieName
  strength: DieName
  smarts: DieName
  spirit: DieName
  vigor: DieName

  // Combat Parameters (all manual)
  pace: string
  parry: string
  toughness: string
  armor: string
  bennies: string
  wounds: string
  fatigue: string
  mana: string

  // Skills
  skills: Skill[]

  // Edges
  edges: Edge[]

  // Hindrances
  hindrances: Hindrance[]

  // Weapons
  weapons: Weapon[]

  // Gear
  gear: string[]

  // Special Rules
  specialRules: SpecialRule[]

  // Arcane Powers
  powers: CharacterPower[]

  // Notes
  notes: string

  // Race
  raceId?: string
  raceName?: string
  size?: number

  // World
  worldId?: string

  // Layout
  layout?: CharacterLayout
}
