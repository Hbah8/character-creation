import { describe, expect, it } from 'vitest'
import { clampMapPan } from '@/maps/services/mapPan'

describe('clampMapPan', () => {
  it('keeps the image centered when it fits inside the viewport', () => {
    expect(clampMapPan(
      { x: 90, y: -70 },
      { width: 800, height: 500 },
      { width: 1000, height: 700 },
    )).toEqual({ x: 0, y: 0 })
  })

  it('allows dragging within the overflow bounds without losing the image', () => {
    expect(clampMapPan(
      { x: 1000, y: -1000 },
      { width: 1400, height: 900 },
      { width: 1000, height: 700 },
    )).toEqual({ x: 200, y: -100 })
  })
})
