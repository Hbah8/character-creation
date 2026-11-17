import { SWADE_ARCANE_BACKGROUNDS } from '@/data/handbooks/arcaneBackgrounds'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { ArcaneBackgroundDefinition, ResolvedEntry, StoredHandbookEntry } from '@/types/handbook'

export function resolveArcaneBackgrounds(
  worldHandbook: readonly StoredHandbookEntry[],
  systemData: readonly ArcaneBackgroundDefinition[] = SWADE_ARCANE_BACKGROUNDS,
): ResolvedEntry<ArcaneBackgroundDefinition>[] {
  return resolveHandbookEntries('arcaneBackground', [...worldHandbook], [...systemData])
}
