import type { Character } from '@/types/character'

export function attachActiveWorldToNewCharacter(character: Character, worldId: string | null): Character {
  if (!worldId || character.worldId) return character
  return { ...character, worldId }
}
