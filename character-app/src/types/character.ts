export type DieName = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | ''

export interface Skill {
  id: string
  name: string
  die: DieName
  linkedAttribute: string
}

export interface Edge {
  id: string
  name: string
  effect: string
}

export interface Hindrance {
  id: string
  name: string
  severity: 'М' | 'К'
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

  // Notes
  notes: string
}
