import type { Character } from '@/types/character'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { resolveCharacter } from '@/services/resolveEffectiveCharacter'
import type { ResolvedCharacter } from '@/services/resolveEffectiveCharacter'

/**
 * Returns the source Character plus explicit effective attributes and combat output for preview/PDF rendering.
 *
 * Looks up the world by `character.worldId` from the world library and applies
 * racial stat modifiers via `resolveCharacter`.
 */
export function useEffectiveCharacter(character: Character): ResolvedCharacter {
  const { entries } = useWorldLibrary()
  const world = entries.find(e => e.id === character.worldId)?.world ?? null
  return resolveCharacter(character, world)
}
