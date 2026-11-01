import { describe, expect, it } from 'vitest'
import { getMagazineCapacity } from '../templates/ammunition'

describe('getMagazineCapacity', () => {
  it('returns a capacity for a positive whole-number magazine', () => {
    expect(getMagazineCapacity('30')).toBe(30)
  })

  it('returns null for non-numeric or non-positive capacities', () => {
    expect(getMagazineCapacity('-')).toBeNull()
    expect(getMagazineCapacity('0')).toBeNull()
    expect(getMagazineCapacity('3x30')).toBeNull()
  })
})
