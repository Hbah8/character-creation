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
  maxWounds: number
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
    maxWounds: 3,
    powerPoints: 0,
    maxPowerPoints: 0,
  }
}