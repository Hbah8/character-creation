import { SWADE_RACIAL_ABILITIES } from '@/data/handbooks/racialAbilities'
import { resolveHandbookEntries } from '@/handbooks/services/handbookResolver'
import type { RacialAbilityRef } from '@/world/types'
import type { HandbookOverride, RacialAbility, ResolvedEntry } from '@/types/handbook'

export type ResolvedRacialAbility = ResolvedEntry<RacialAbility>

function normalizeResolvedAbility(ability: ResolvedRacialAbility): ResolvedRacialAbility {
  return {
    ...ability,
    maxRepeat: ability.maxRepeat ?? 1,
    parameterSchema: ability.parameterSchema ?? [],
  }
}

function stableParameters(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '{}'
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined && item !== '')
    .sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify(Object.fromEntries(entries))
}

export function haveSameRacialAbilityParameters(
  left: RacialAbilityRef['parameters'],
  right: RacialAbilityRef['parameters'],
): boolean {
  return stableParameters(left) === stableParameters(right)
}

export function getUsedRepeatCount(selected: RacialAbilityRef[], id: string): number {
  return selected
    .filter(ability => ability.id === id)
    .reduce((total, ability) => total + Math.max(1, ability.repeatCount ?? 1), 0)
}

export function canSelectRacialAbility(
  ability: RacialAbility,
  selected: RacialAbilityRef[],
  parameters?: RacialAbilityRef['parameters'],
): boolean {
  const maxRepeat = ability.maxRepeat ?? 1
  if (maxRepeat === 'unlimited') {
    if (parameters === undefined) return true
    return !selected.some(ref =>
      ref.id === ability.id && haveSameRacialAbilityParameters(ref.parameters, parameters)
    )
  }

  return getUsedRepeatCount(selected, ability.id) < maxRepeat
}

export function resolveRacialAbilitiesForWorld(
  worldHandbook: HandbookOverride[],
): ResolvedRacialAbility[] {
  return resolveHandbookEntries(
    'racialAbility',
    worldHandbook,
    [...SWADE_RACIAL_ABILITIES],
  ).map(normalizeResolvedAbility)
}

export function getAvailableRacialAbilities(
  abilities: ResolvedRacialAbility[],
  selected: RacialAbilityRef[],
): ResolvedRacialAbility[] {
  return abilities.filter(ability => canSelectRacialAbility(ability, selected))
}
