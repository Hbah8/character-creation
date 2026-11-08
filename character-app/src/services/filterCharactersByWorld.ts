import type { Character } from '@/types/character'

export function filterCharactersByWorld<T extends { character: Pick<Character, 'worldId'> }>(
  entries: readonly T[],
  worldId: string | null,
): T[] {
  return entries.filter(entry => worldId === null
    ? !entry.character.worldId
    : entry.character.worldId === worldId)
}
