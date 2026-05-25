import { SWADE_RACIAL_ABILITIES } from '@/data/handbooks/racialAbilities'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { RacialAbilityRef } from '@/world/types'
import type { HandbookOverride, RacialAbility, ResolvedEntry } from '@/types/handbook'

export type ResolvedRacialAbility = ResolvedEntry<RacialAbility>

export function resolveRacialAbilitiesForWorld(
  worldHandbook: HandbookOverride[],
): ResolvedRacialAbility[] {
  return resolveHandbookEntries(
    'racialAbility',
    worldHandbook,
    [...SWADE_RACIAL_ABILITIES],
  )
}

export function getAvailableRacialAbilities(
  abilities: ResolvedRacialAbility[],
  selected: RacialAbilityRef[],
): ResolvedRacialAbility[] {
  const selectedIds = new Set(selected.map(ability => ability.id))
  return abilities.filter(ability => !selectedIds.has(ability.id))
}
