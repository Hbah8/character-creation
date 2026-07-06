import type { Character } from '@/types/character'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { resolveEffectiveCharacter } from '@/services/resolveEffectiveCharacter'

/**
 * Returns the effective character for preview/PDF rendering.
 *
 * Looks up the world by `character.worldId` from the world library and applies
 * racial stat modifiers via `resolveEffectiveCharacter`.
 *
 * Returns the base `character` unchanged when:
 * - No worldId is set on the character
 * - The world is not found in the library
 * - The character has no raceId
 * - The raceId is not found in the world's races
 */
export function useEffectiveCharacter(character: Character): Character {
  const { entries } = useWorldLibrary()
  const world = entries.find(e => e.id === character.worldId)?.world ?? null
  return resolveEffectiveCharacter(character, world)
}
