import { describe, expect, it } from 'vitest'
import { addEdgeReference, removeEdgeReference } from '@/services/characterEdgeService'

describe('characterEdgeService', () => {
  it('adds only a canonical handbook reference and prevents duplicate selection', () => {
    const edges = addEdgeReference([], 'bditelnost', 'edge-row')

    expect(edges).toEqual([{ id: 'edge-row', edgeId: 'bditelnost' }])
    expect(addEdgeReference(edges, 'bditelnost', 'other-row')).toBe(edges)
  })

  it('clears Arcane Background when the final Mystic Gift reference is removed', () => {
    const result = removeEdgeReference([
      { id: 'gift-row', edgeId: 'misticheskiy-dar' },
      { id: 'vigilant-row', edgeId: 'bditelnost' },
    ], 'gift-row', 'Magic')

    expect(result).toEqual({
      edges: [{ id: 'vigilant-row', edgeId: 'bditelnost' }],
      arcaneBackground: undefined,
    })
  })
})