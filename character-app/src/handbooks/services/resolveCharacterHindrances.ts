import { SWADE_HINDRANCES } from '@/data/handbooks/hindrances'
import type { Hindrance as CharacterHindrance, ResolvedCharacterHindrance } from '@/types/character'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { Hindrance, ResolvedEntry, StoredHandbookEntry } from '@/types/handbook'

export function resolveHindranceDefinitions(
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<Hindrance>[] {
  return resolveHandbookEntries('hindrance', [...worldHandbook], [...SWADE_HINDRANCES])
}

export function toCharacterHindrance(
  definition: Pick<Hindrance, 'id' | 'name' | 'type' | 'description'>,
): Omit<CharacterHindrance, 'id'> {
  return {
    hindranceId: definition.id,
    name: definition.name,
    severity: definition.type === 'Major' ? 'major' : 'minor',
    description: definition.description,
  }
}

export function resolveCharacterHindrances(
  selectedHindrances: readonly CharacterHindrance[],
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedCharacterHindrance[] {
  const definitionsById = new Map(
    resolveHindranceDefinitions(worldHandbook).map(definition => [definition.id, definition]),
  )

  return selectedHindrances.map(selected => {
    const definition = selected.hindranceId
      ? definitionsById.get(selected.hindranceId)
      : undefined
    if (!definition) {
      if (
        selected.name === undefined
        || selected.severity === undefined
        || selected.description === undefined
      ) {
        throw new Error(`validation.hindrance.unknownHindrance:${selected.hindranceId ?? selected.id}`)
      }
      return { ...selected, name: selected.name, severity: selected.severity, description: selected.description }
    }

    return {
      ...selected,
      name: definition.name,
      severity: definition.type === 'Major' ? 'major' : 'minor',
      description: definition.description,
      source: definition.source,
    }
  })
}
