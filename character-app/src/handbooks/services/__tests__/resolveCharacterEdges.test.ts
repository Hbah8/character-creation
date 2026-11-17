import { describe, expect, it } from 'vitest'
import {
  groupResolvedCharacterEdges,
  resolveCharacterEdges,
  resolveEdgeDefinitions,
} from '@/handbooks/services/resolveCharacterEdges'

describe('resolveCharacterEdges', () => {
  it('uses the system edge catalog for a character without a world', () => {
    const catalog = resolveEdgeDefinitions([])
    const [edge] = resolveCharacterEdges([{ id: 'character-edge', edgeId: 'bditelnost' }], [])

    expect(catalog.find(candidate => candidate.id === 'bditelnost')).toMatchObject({ source: 'system' })
    expect(edge).toMatchObject({
      id: 'character-edge',
      edgeId: 'bditelnost',
      name: 'Бдительность',
      type: 'Background',
      source: 'system',
    })
  })

  it('uses custom-world additions and overrides only from the character world', () => {
    const handbook = [
      {
        mode: 'override',
        handbookCategory: 'edge',
        id: 'bditelnost',
        name: 'Campaign Vigilance',
        description: 'Custom world rule.',
      },
      {
        mode: 'custom',
        handbookCategory: 'edge',
        id: 'house-edge',
        name: 'House Edge',
        description: 'World-only edge.',
        type: 'Weird',
      },
    ] as const

    const resolved = resolveCharacterEdges([
      { id: 'override-row', edgeId: 'bditelnost' },
      { id: 'custom-row', edgeId: 'house-edge' },
    ], handbook)

    expect(resolved).toEqual(expect.arrayContaining([
      expect.objectContaining({ edgeId: 'bditelnost', name: 'Campaign Vigilance', source: 'world' }),
      expect.objectContaining({ edgeId: 'house-edge', name: 'House Edge', source: 'world' }),
    ]))
  })

  it('groups repeated repeatable edges and preserves a repeat count', () => {
    const resolved = resolveCharacterEdges([
      { id: 'new-powers-1', edgeId: 'novye-sily' },
      { id: 'new-powers-2', edgeId: 'novye-sily' },
      { id: 'power-points-1', edgeId: 'punkty-sily' },
    ], [])

    expect(groupResolvedCharacterEdges(resolved)).toEqual([
      expect.objectContaining({
        edgeId: 'novye-sily',
        id: 'new-powers-1',
        repeatCount: 2,
      }),
      expect.objectContaining({
        edgeId: 'punkty-sily',
        id: 'power-points-1',
        repeatCount: 1,
      }),
    ])
  })
})