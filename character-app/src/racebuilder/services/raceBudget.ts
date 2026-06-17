import type { ResolvedRacialAbility } from '@/racebuilder/services/racialAbilityOptions'
import type { Rank } from '@/types/handbook'
import type { Race, RacialAbilityRef, World } from '@/world/types'

export interface RaceBudgetStatus {
  budget: number
  spent: number
  remaining: number
  isValid: boolean
}

const DEFAULT_RACE_POINTS_BUDGET = 2
const SIZE_PLUS_IDS = new Set(['size-plus-1', 'размер-плюс-1'])
const SIZE_MINUS_IDS = new Set(['size-minus-1', 'размер-минус-1'])
const EDGE_RANK_COST: Record<Rank, number> = {
  Novice: 2,
  Seasoned: 3,
  Veteran: 4,
  Heroic: 5,
  Legendary: 6,
}

function repeatCount(ref: RacialAbilityRef): number {
  return Math.max(1, ref.repeatCount ?? 1)
}

export function computeRaceBudget(world: World): number {
  return world.settingRules.racePointsBudget ?? DEFAULT_RACE_POINTS_BUDGET
}

export function computeRacialEdgeCost(rank: Rank = 'Novice'): number {
  return EDGE_RANK_COST[rank]
}

export function resolveRacialAbilityPointCost(
  ref: RacialAbilityRef,
  ability?: ResolvedRacialAbility,
): number {
  const costTier = ref.parameters?.costTier
  if (typeof costTier === 'number' && Number.isFinite(costTier)) {
    return costTier
  }

  if (typeof ability?.points === 'number') {
    return ability.points
  }

  return ability?.pointCostOptions?.[0] ?? 0
}

export function computeSpentPoints(
  abilities: RacialAbilityRef[],
  catalog: ResolvedRacialAbility[],
): number {
  const catalogById = new Map(catalog.map(ability => [ability.id, ability]))

  return abilities.reduce((total, ref) => {
    const ability = catalogById.get(ref.id)
    return total + resolveRacialAbilityPointCost(ref, ability) * repeatCount(ref)
  }, 0)
}

export function computeRaceBudgetStatus(
  race: Race,
  world: World,
  catalog: ResolvedRacialAbility[],
): RaceBudgetStatus {
  const budget = computeRaceBudget(world)
  const spent = computeSpentPoints(race.abilities, catalog)
  const remaining = budget - spent

  return {
    budget,
    spent,
    remaining,
    isValid: spent <= budget,
  }
}

export function computeSizeFromAbilities(abilities: RacialAbilityRef[]): number {
  return abilities.reduce((total, ref) => {
    if (SIZE_PLUS_IDS.has(ref.id)) return total + repeatCount(ref)
    if (SIZE_MINUS_IDS.has(ref.id)) return total - repeatCount(ref)
    return total
  }, 0)
}
