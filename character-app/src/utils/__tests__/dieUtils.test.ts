import { describe, it, expect } from 'vitest'
import { advanceDie, recessDie } from '@/utils/dieUtils'

describe('advanceDie', () => {
  it('advances d4 by 1 step to d6', () => {
    expect(advanceDie('d4', 1)).toBe('d6')
  })

  it('advances d6 by 2 steps to d10', () => {
    expect(advanceDie('d6', 2)).toBe('d10')
  })

  it('advances d10 by 1 step to d12', () => {
    expect(advanceDie('d10', 1)).toBe('d12')
  })

  it('advances d12 by 1 step to d12+1', () => {
    expect(advanceDie('d12', 1)).toBe('d12+1')
  })

  it('advances d12+1 by 1 step to d12+2', () => {
    expect(advanceDie('d12+1', 1)).toBe('d12+2')
  })

  it('caps at d12+2 (hard cap)', () => {
    expect(advanceDie('d12+2', 1)).toBe('d12+2')
    expect(advanceDie('d12+2', 10)).toBe('d12+2')
  })

  it('advances d12 by 2 steps to d12+2', () => {
    expect(advanceDie('d12', 2)).toBe('d12+2')
  })

  it('advances d12 by 3 or more steps still caps at d12+2', () => {
    expect(advanceDie('d12', 3)).toBe('d12+2')
  })

  it('returns same die when steps is 0', () => {
    expect(advanceDie('d6', 0)).toBe('d6')
    expect(advanceDie('d12+1', 0)).toBe('d12+1')
  })

  it('does not advance the empty die value (no-die)', () => {
    expect(advanceDie('', 1)).toBe('')
  })
})

describe('recessDie', () => {
  it('regresses d12 by 1 step to d10', () => {
    expect(recessDie('d12', 1)).toBe('d10')
  })

  it('regresses d12+2 by 1 step to d12+1', () => {
    expect(recessDie('d12+2', 1)).toBe('d12+1')
  })

  it('regresses d12+2 by 2 steps to d12', () => {
    expect(recessDie('d12+2', 2)).toBe('d12')
  })

  it('regresses d6 by 1 step to d4', () => {
    expect(recessDie('d6', 1)).toBe('d4')
  })

  it('floors at d4 (hard floor)', () => {
    expect(recessDie('d4', 1)).toBe('d4')
    expect(recessDie('d4', 10)).toBe('d4')
  })

  it('returns same die when steps is 0', () => {
    expect(recessDie('d8', 0)).toBe('d8')
  })

  it('does not recess the empty die value (no-die)', () => {
    expect(recessDie('', 1)).toBe('')
  })
})
