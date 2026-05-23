import type { HandbookEntry, HandbookSource } from '@/types/handbook'

export type HandbookFacetKey =
  | 'arcaneBackground'
  | 'category'
  | 'rank'
  | 'source'
  | 'type'
  | 'wildCardOnly'

export type HandbookFacetFilters = Partial<Record<HandbookFacetKey, readonly string[]>>

export interface HandbookFilterState {
  query: string
  facets: HandbookFacetFilters
}

type FilterInput = string | Partial<HandbookFilterState>

const FACET_KEYS: HandbookFacetKey[] = [
  'arcaneBackground',
  'category',
  'rank',
  'source',
  'type',
  'wildCardOnly',
]

export function createEmptyHandbookFilters(): HandbookFilterState {
  return { query: '', facets: {} }
}

export function hasActiveHandbookFilters(filters: HandbookFilterState): boolean {
  return filters.query.trim().length > 0 ||
    FACET_KEYS.some(key => (filters.facets[key]?.length ?? 0) > 0)
}

export function getHandbookEntryFacetValues(
  entry: HandbookEntry,
  key: HandbookFacetKey,
): string[] {
  const record = entry as HandbookEntry & {
    arcaneBackground?: string[]
    category?: string
    requirements?: { rank?: string }
    source?: HandbookSource
    type?: string
    wildCardOnly?: boolean
  }

  switch (key) {
    case 'arcaneBackground':
      return record.arcaneBackground ?? []
    case 'category':
      return record.category ? [record.category] : []
    case 'rank':
      return [record.requirements?.rank ?? 'none']
    case 'source':
      return [record.source ?? 'system']
    case 'type':
      return record.type ? [record.type] : []
    case 'wildCardOnly':
      return [record.wildCardOnly ? 'true' : 'false']
  }
}

function normalizeFilterInput(input: FilterInput): HandbookFilterState {
  if (typeof input === 'string') {
    return { query: input, facets: {} }
  }

  return {
    query: input.query ?? '',
    facets: input.facets ?? {},
  }
}

export function filterHandbookEntries<T extends HandbookEntry>(
  entries: readonly T[],
  input: FilterInput,
): T[] {
  const filters = normalizeFilterInput(input)
  const q = filters.query.trim().toLowerCase()

  return entries.filter(entry => {
    const matchesQuery = !q || entry.name.toLowerCase().includes(q)
    if (!matchesQuery) return false

    return FACET_KEYS.every(key => {
      const selected = filters.facets[key] ?? []
      if (selected.length === 0) return true

      const values = getHandbookEntryFacetValues(entry, key)
      return values.some(value => selected.includes(value))
    })
  })
}
