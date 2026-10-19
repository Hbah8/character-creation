import { describe, expect, it } from 'vitest'
import { resolveCharacterEdges, resolveEdgeDefinitions } from '@/handbooks/services/resolveCharacterEdges'

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
})