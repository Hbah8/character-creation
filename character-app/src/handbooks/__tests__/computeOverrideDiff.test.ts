import { describe, it, expect } from 'vitest'
import { computeOverrideDiff } from '@/handbooks/utils/computeOverrideDiff'
import type { AnyHandbookEntry } from '@/handbooks/types'

const baseEdge: AnyHandbookEntry = {
  id: 'level-headed',
  name: 'Level Headed',
  description: 'Draw two action cards.',
  type: 'Combat',
} as AnyHandbookEntry

describe('computeOverrideDiff', () => {
  it('returns empty object when form values match base entry exactly', () => {
    const diff = computeOverrideDiff(baseEdge, {
      name: 'Level Headed',
      description: 'Draw two action cards.',
    })
    expect(diff).toEqual({})
  })

  it('returns only changed fields', () => {
    const diff = computeOverrideDiff(baseEdge, {
      name: 'Level Headed (House Rule)',
      description: 'Draw two action cards.',
    })
    expect(diff).toEqual({ name: 'Level Headed (House Rule)' })
  })

  it('returns all fields that differ', () => {
    const diff = computeOverrideDiff(baseEdge, {
      name: 'Changed',
      description: 'Changed too.',
    })
    expect(diff).toEqual({ name: 'Changed', description: 'Changed too.' })
  })

  it('treats empty string as a change from a non-empty base value', () => {
    const diff = computeOverrideDiff(baseEdge, { name: '' })
    expect(diff).toEqual({ name: '' })
  })

  it('ignores keys present in form but absent in base when value is undefined', () => {
    const diff = computeOverrideDiff(baseEdge, { name: 'Level Headed', range: undefined })
    expect(diff).toEqual({})
  })

  it('includes new keys with defined values not present in base', () => {
    const diff = computeOverrideDiff(baseEdge, { name: 'Level Headed', requirements: { rank: 'Seasoned' } })
    expect(diff).toEqual({ requirements: { rank: 'Seasoned' } })
  })

  it('returns all form fields as diff when base is undefined (custom entry)', () => {
    const diff = computeOverrideDiff(undefined, {
      name: 'Custom Edge',
      description: 'A custom edge.',
    })
    expect(diff).toEqual({ name: 'Custom Edge', description: 'A custom edge.' })
  })
})
