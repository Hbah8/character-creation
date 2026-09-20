import { resolveCharacter } from '@/services/resolveEffectiveCharacter'
import type { Character } from '@/types/character'
import type { World } from '@/world/types'
import type { CombatantType } from '@/combat/types'

export interface CharacterCombatantDraft {
  name: string
  type: CombatantType
  isPlayer: boolean
  pace: number
  parry: number
  toughness: number
  armor: number
  bennies: number
  maxWounds: number
  maxFatigue: number
  powerPoints: number
  maxPowerPoints: number
}

export function createCharacterCombatantDraft(character: Character, world: World | null): CharacterCombatantDraft {
  const resolved = resolveCharacter(character, world)
  return {
    name: character.callsign || character.name || 'Без имени',
    type: 'wildcard',
    isPlayer: true,
    pace: resolved.combat.pace,
    parry: resolved.combat.parry,
    toughness: resolved.combat.toughness,
    armor: resolved.combat.armor,
    bennies: resolved.combat.bennies,
    maxWounds: resolved.combat.maxWounds,
    maxFatigue: resolved.combat.maxFatigue,
    powerPoints: resolved.combat.powerPoints,
    maxPowerPoints: resolved.combat.powerPoints,
  }
}