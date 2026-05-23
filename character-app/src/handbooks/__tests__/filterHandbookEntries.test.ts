import { describe, it, expect } from 'vitest'
import {
  createEmptyHandbookFilters,
  filterHandbookEntries,
  hasActiveHandbookFilters,
} from '../utils/filterHandbookEntries'

const entries = [
  { id: 'luck', name: 'Luck', description: 'Extra benny per session.' },
  { id: 'block', name: 'Block', description: 'Adds +1 to Parry.' },
  { id: 'counterattack', name: 'Counterattack', description: 'Free attack on miss.' },
]

const edgeEntries = [
  {
    id: 'luck',
    name: 'Luck',
    description: 'Extra benny per session.',
    type: 'Background',
    requirements: { rank: 'Novice' },
    source: 'system',
  },
  {
    id: 'block',
    name: 'Block',
    description: 'Adds +1 to Parry.',
    type: 'Combat',
    requirements: { rank: 'Seasoned' },
    source: 'world',
  },
  {
    id: 'wild-card-edge',
    name: 'Wild Card Edge',
    description: 'Wild cards only.',
    type: 'WildCard',
    wildCardOnly: true,
    source: 'system',
  },
] as const

describe('filterHandbookEntries', () => {
  it('returns all entries when query is empty', () => {
    expect(filterHandbookEntries(entries, '')).toHaveLength(3)
  })

  it('filters by name case-insensitively (lowercase)', () => {
    expect(filterHandbookEntries(entries, 'luck')).toHaveLength(1)
    expect(filterHandbookEntries(entries, 'luck')[0].id).toBe('luck')
  })

  it('filters by name case-insensitively (uppercase)', () => {
    expect(filterHandbookEntries(entries, 'LUCK')).toHaveLength(1)
  })

  it('filters by name case-insensitively (mixed case)', () => {
    expect(filterHandbookEntries(entries, 'Luck')).toHaveLength(1)
  })

  it('returns all entries matching name substring (all three contain "ck")', () => {
    // Luck (lu-ck), Block (blo-ck), Counterattack (counteratta-ck)
    expect(filterHandbookEntries(entries, 'ck')).toHaveLength(3)
  })

  it('returns only one entry for a more specific substring', () => {
    expect(filterHandbookEntries(entries, 'attack')).toHaveLength(1)
    expect(filterHandbookEntries(entries, 'attack')[0].id).toBe('counterattack')
  })

  it('returns empty array when no matches', () => {
    expect(filterHandbookEntries(entries, 'zzz')).toHaveLength(0)
  })

  it('trims whitespace from query before filtering', () => {
    expect(filterHandbookEntries(entries, '  luck  ')).toHaveLength(1)
  })

  it('returns all entries when query is only whitespace', () => {
    expect(filterHandbookEntries(entries, '   ')).toHaveLength(3)
  })

  it('preserves the original entry objects in the result', () => {
    const result = filterHandbookEntries(entries, 'luck')
    expect(result[0]).toBe(entries[0])
  })

  it('filters by a selected facet value', () => {
    const result = filterHandbookEntries(edgeEntries, {
      query: '',
      facets: { type: ['Combat'] },
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('block')
  })

  it('combines query and facet filters', () => {
    const result = filterHandbookEntries(edgeEntries, {
      query: 'block',
      facets: { source: ['world'], rank: ['Seasoned'] },
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('block')
  })

  it('treats missing rank as the none facet value', () => {
    const result = filterHandbookEntries(edgeEntries, {
      query: '',
      facets: { rank: ['none'] },
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('wild-card-edge')
  })

  it('filters boolean facets by their normalized values', () => {
    const result = filterHandbookEntries(edgeEntries, {
      query: '',
      facets: { wildCardOnly: ['true'] },
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('wild-card-edge')
  })

  it('reports whether a filter state is active', () => {
    expect(hasActiveHandbookFilters(createEmptyHandbookFilters())).toBe(false)
    expect(hasActiveHandbookFilters({ query: 'luck', facets: {} })).toBe(true)
    expect(hasActiveHandbookFilters({ query: '', facets: { type: ['Combat'] } })).toBe(true)
  })
})
