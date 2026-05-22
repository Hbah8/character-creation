import { describe, it, expect } from 'vitest'
import { filterHandbookEntries } from '../utils/filterHandbookEntries'

const entries = [
  { id: 'luck', name: 'Luck', description: 'Extra benny per session.' },
  { id: 'block', name: 'Block', description: 'Adds +1 to Parry.' },
  { id: 'counterattack', name: 'Counterattack', description: 'Free attack on miss.' },
]

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
})
