import type { Character } from '@/types/character'
import type {
  ArcaneBackgroundRequirement,
  Edge,
  EdgeRequirement,
  EdgeRequirementCondition,
  EdgeType,
  Rank,
} from '@/types/handbook'

const RANK_INDEX: Record<Rank, number> = {
  Novice: 0,
  Seasoned: 1,
  Veteran: 2,
  Heroic: 3,
  Legendary: 4,
}

const DIE_INDEX: Record<string, number> = {
  '': 0,
  d4: 1,
  d6: 2,
  d8: 3,
  d10: 4,
  d12: 5,
  'd12+1': 6,
  'd12+2': 7,
}

export type UnmetEdgeRequirement =
  | { type: 'rank'; minimum: Rank }
  | { type: 'attribute'; attribute: string; minimum: string }
  | { type: 'skill'; skill: string; minimum: string }
  | { type: 'edge'; edgeId: string }
  | { type: 'hindrance'; hindranceId: string }
  | { type: 'race'; raceId: string }
  | { type: 'wildCard' }
  | { type: 'arcaneBackground'; minimum: Exclude<ArcaneBackgroundRequirement, 'any'> }
  | { type: 'text'; text: string }
  | { type: 'anyOf'; conditions: UnmetEdgeRequirement[] }

export interface EdgeSelectionOption {
  edge: Edge
  isAvailable: boolean
  unmetRequirements: UnmetEdgeRequirement[]
}

export interface EdgeSelectionFilters {
  query?: string
  type?: EdgeType
  showUnavailable: boolean
}

export function getEdgeSelectionOptions(
  edges: readonly Edge[],
  character: Character,
): EdgeSelectionOption[] {
  return edges.map(edge => {
    const unmetRequirements = getUnmetRequirements(edge, character)
    return { edge, unmetRequirements, isAvailable: unmetRequirements.length === 0 }
  })
}

export function filterEdgeSelectionOptions(
  options: readonly EdgeSelectionOption[],
  filters: EdgeSelectionFilters,
): EdgeSelectionOption[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? ''
  return options.filter(option =>
    (filters.showUnavailable || option.isAvailable)
    && (!filters.type || option.edge.type === filters.type)
    && (!query || option.edge.name.toLocaleLowerCase().includes(query)),
  )
}

export function getUnmetRequirements(edge: Edge, character: Character): UnmetEdgeRequirement[] {
  const unmet = edge.requirements?.allOf.flatMap(requirement => {
    const missing = getMissingRequirement(requirement, character)
    return missing ? [missing] : []
  }) ?? []

  if (edge.wildCardOnly && !character.isWildCard && !unmet.some(requirement => requirement.type === 'wildCard')) {
    unmet.push({ type: 'wildCard' })
  }

  return unmet
}

function getMissingRequirement(
  requirement: EdgeRequirement,
  character: Character,
): UnmetEdgeRequirement | null {
  if ('anyOf' in requirement) {
    const unmet = requirement.anyOf.flatMap(condition => {
      const missing = getMissingCondition(condition, character)
      return missing ? [missing] : []
    })
    return unmet.length === requirement.anyOf.length ? { type: 'anyOf', conditions: unmet } : null
  }
  return getMissingCondition(requirement, character)
}

function getMissingCondition(
  condition: EdgeRequirementCondition,
  character: Character,
): UnmetEdgeRequirement | null {
  switch (condition.type) {
    case 'rank':
      return rankIndex(character.rank) >= RANK_INDEX[condition.minimum] ? null : condition
    case 'attribute':
      return dieIndex(character[condition.attribute]) >= dieIndex(condition.minimum) ? null : condition
    case 'skill': {
      const skill = character.skills.find(candidate => candidate.skillKey === condition.skill)
      return dieIndex(skill?.die ?? '') >= dieIndex(condition.minimum) ? null : condition
    }
    case 'edge':
      if (!character.edges.some(edge => edge.edgeId === condition.edgeId)) return { type: 'edge', edgeId: condition.edgeId }
      if (!condition.arcaneBackground || condition.arcaneBackground === 'any') return null
      return matchesArcaneBackground(character, condition.arcaneBackground)
        ? null
        : { type: 'arcaneBackground', minimum: condition.arcaneBackground }
    case 'hindrance':
      return character.hindrances.some(hindrance =>
        (hindrance.hindranceId ?? hindrance.id) === condition.hindranceId,
      ) ? null : condition
    case 'race':
      return character.raceId === condition.raceId ? null : condition
    case 'wildCard':
      return character.isWildCard ? null : condition
    case 'text':
      return condition
  }
}

function rankIndex(rank: string): number {
  return rank in RANK_INDEX ? RANK_INDEX[rank as Rank] : -1
}

function dieIndex(die: string): number {
  return DIE_INDEX[die] ?? 0
}

function matchesArcaneBackground(
  character: Character,
  requirement: Exclude<ArcaneBackgroundRequirement, 'any'>,
): boolean {
  const backgroundToRequirement: Record<NonNullable<Character['arcaneBackground']>, Exclude<ArcaneBackgroundRequirement, 'any'>> = {
    Magic: 'magic',
    Miracles: 'miracles',
    Psionics: 'psionics',
    SuperPowers: 'gifted',
    WeirdScience: 'weirdScience',
  }
  return character.arcaneBackground !== undefined && backgroundToRequirement[character.arcaneBackground] === requirement
}