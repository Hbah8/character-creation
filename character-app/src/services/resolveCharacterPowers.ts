import { SWADE_POWERS } from '@/data/handbooks/powers'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import { normalizeArcaneBackgroundId } from '@/handbooks/utils/arcaneBackgrounds'
import type { CharacterPower, ResolvedCharacterPower } from '@/types/character'
import type { ArcaneBackground, Power, ResolvedEntry, StoredHandbookEntry } from '@/types/handbook'

export function resolvePowerCatalog(
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<Power>[] {
  return resolveHandbookEntries('power', [...worldHandbook], [...SWADE_POWERS])
}

export function resolveAvailablePowers(
  arcaneBackground: ArcaneBackground | undefined,
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedEntry<Power>[] {
  if (!arcaneBackground) return []
  const selectedBackground = normalizeArcaneBackgroundId(arcaneBackground)
  return resolvePowerCatalog(worldHandbook).filter(power =>
    power.arcaneBackground.some(background =>
      normalizeArcaneBackgroundId(background) === selectedBackground,
    ),
  )
}

export function resolveCharacterPowers(
  selectedPower: CharacterPower,
  arcaneBackground: ArcaneBackground | undefined,
  worldHandbook: readonly StoredHandbookEntry[],
): ResolvedCharacterPower {
  const definition = resolveAvailablePowers(arcaneBackground, worldHandbook)
    .find(power => power.id === selectedPower.powerId)
  if (!definition) return { ...selectedPower, sourceAvailable: false }

  return {
    ...selectedPower,
    name: definition.name,
    ppCost: definition.ppCost,
    range: definition.range,
    duration: definition.duration,
    description: definition.description,
    sourceAvailable: true,
  }
}
