export type CombatantType = 'wildcard' | 'extra' | 'group'

export type CombatantStatus =
  | 'shaken'
  | 'distracted'
  | 'vulnerable'
  | 'stunned'
  | 'incapacitated'
  | 'dying'

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣' | 'joker'
  value: number
  label: string
}

export interface Combatant {
  id: string
  name: string
  type: CombatantType
  isPlayer: boolean
  wounds: number
  fatigue: number
  bennies: number
  count: number
  eliminated: boolean
  card?: Card
  pendingCard?: Card
  statuses: CombatantStatus[]
  /** Groups only: number of shocked members */
  groupShocked?: number
  /** Groups only: number of eliminated members */
  groupEliminated?: number
  /** Combat stats */
  pace: number
  parry: number
  toughness: number
  maxWounds: number
  powerPoints: number
  maxPowerPoints: number
}
