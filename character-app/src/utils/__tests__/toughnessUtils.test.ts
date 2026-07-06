import { describe, it, expect } from 'vitest'
import { parseToughness, formatToughness } from '@/utils/toughnessUtils'

describe('parseToughness', () => {
  it('parses a plain number string', () => {
    expect(parseToughness('6')).toEqual({ base: 6, armor: 0 })
  })

  it('parses a number with armor in parentheses', () => {
    expect(parseToughness('8 (2)')).toEqual({ base: 8, armor: 2 })
  })

  it('parses with no space before parentheses', () => {
    expect(parseToughness('8(2)')).toEqual({ base: 8, armor: 2 })
  })

  it('parses with extra whitespace', () => {
    expect(parseToughness('  10  (  4  )  ')).toEqual({ base: 10, armor: 4 })
  })

  it('returns null for an unparseable string', () => {
    expect(parseToughness('unparseable')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseToughness('')).toBeNull()
  })

  it('returns null for a string with letters mixed in', () => {
    expect(parseToughness('8+2')).toBeNull()
  })

  it('parses large numbers correctly', () => {
    expect(parseToughness('12 (6)')).toEqual({ base: 12, armor: 6 })
  })
})

describe('formatToughness', () => {
  it('formats base-only as a plain number string', () => {
    expect(formatToughness(9, 0)).toBe('9')
  })

  it('formats base with armor in SWADE parentheses notation', () => {
    expect(formatToughness(10, 4)).toBe('10 (4)')
  })

  it('formats armor of 0 as plain number, not "9 (0)"', () => {
    expect(formatToughness(9, 0)).toBe('9')
  })

  it('formats negative total as string', () => {
    expect(formatToughness(-1, 0)).toBe('-1')
  })
})
