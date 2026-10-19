import { describe, expect, it } from 'vitest'
import { addEdgeReference, getDependentEdges, removeEdgeReference } from '@/services/characterEdgeService'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import type { Character } from '@/types/character'
import type { Edge } from '@/types/handbook'
import { SWADE_EDGES } from '@/data/handbooks/edges'

const dependencyDefinitions: Edge[] = [
  { id: 'attractive', name: 'Attractive', description: '', type: 'Social' },
  {
    id: 'very-attractive',
    name: 'Very Attractive',
    description: '',
    type: 'Social',
    requirements: { allOf: [{ type: 'edge', edgeId: 'attractive' }] },
  },
  {
    id: 'exceptionally-attractive',
    name: 'Exceptionally Attractive',
    description: '',
    type: 'Social',
    requirements: { allOf: [{ type: 'edge', edgeId: 'very-attractive' }] },
  },
  {
    id: 'first-strike',
    name: 'First Strike',
    description: '',
    type: 'Combat',
    requirements: { allOf: [{ type: 'attribute', attribute: 'agility', minimum: 'd8' }] },
  },
  {
    id: 'counterattack',
    name: 'Counterattack',
    description: '',
    type: 'Combat',
    requirements: { allOf: [{ type: 'skill', skill: 'fighting', minimum: 'd8' }] },
  },
  {
    id: 'clear-conscience',
    name: 'Clear Conscience',
    description: '',
    type: 'Social',
    requirements: { allOf: [{ type: 'hindrance', hindranceId: 'code-of-honor' }] },
  },
]

function characterWithEdges(edges: Character['edges']): Character {
  return {
    ...enDefaultCharacter,
    agility: 'd8',
    skills: [{ id: 'fighting-row', skillKey: 'fighting', die: 'd8' }],
    edges,
  }
}

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

  it('returns transitive edge dependents when a prerequisite edge is removed', () => {
    const current = characterWithEdges([
      { id: 'attractive-row', edgeId: 'attractive' },
      { id: 'very-attractive-row', edgeId: 'very-attractive' },
      { id: 'exceptionally-attractive-row', edgeId: 'exceptionally-attractive' },
    ])
    const proposed = { ...current, edges: current.edges.slice(1) }

    expect(getDependentEdges(current, proposed, dependencyDefinitions)).toEqual([
      { id: 'very-attractive-row', edgeId: 'very-attractive' },
      { id: 'exceptionally-attractive-row', edgeId: 'exceptionally-attractive' },
    ])
  })

  it('cascades the reported SWADE examples using the handbook prerequisites', () => {
    const current: Character = {
      ...enDefaultCharacter,
      rank: 'Seasoned',
      vigor: 'd6',
      agility: 'd8',
      skills: [{ id: 'fighting-row', skillKey: 'fighting', die: 'd8' }],
      edges: [
        { id: 'attractive-row', edgeId: 'privlekatelnost' },
        { id: 'very-attractive-row', edgeId: 'privlekatelnost-plus' },
        { id: 'first-strike-row', edgeId: 'uprezhdayuschiy-udar' },
        { id: 'counterattack-row', edgeId: 'kontrataka' },
      ],
    }

    expect(getDependentEdges(current, {
      ...current,
      edges: current.edges.filter(edge => edge.edgeId !== 'privlekatelnost'),
    }, SWADE_EDGES).map(edge => edge.edgeId)).toEqual(['privlekatelnost-plus'])
    expect(getDependentEdges(current, { ...current, agility: 'd6' }, SWADE_EDGES).map(edge => edge.edgeId))
      .toEqual(['uprezhdayuschiy-udar'])
    expect(getDependentEdges(current, { ...current, skills: [] }, SWADE_EDGES).map(edge => edge.edgeId))
      .toEqual(['kontrataka'])
  })

  it('returns edges that lose an attribute, skill, or hindrance prerequisite', () => {
    const current = characterWithEdges([
      { id: 'first-strike-row', edgeId: 'first-strike' },
      { id: 'counterattack-row', edgeId: 'counterattack' },
      { id: 'clear-conscience-row', edgeId: 'clear-conscience' },
    ])
    current.hindrances = [{ id: 'code-of-honor', name: 'Code of Honor', severity: 'minor', description: '' }]
    const loweredAgility = { ...current, agility: 'd6' as const }
    const removedFighting = { ...current, skills: [] }
    const removedHindrance = { ...current, hindrances: [] }

    expect(getDependentEdges(current, loweredAgility, dependencyDefinitions)).toEqual([
      { id: 'first-strike-row', edgeId: 'first-strike' },
    ])
    expect(getDependentEdges(current, removedFighting, dependencyDefinitions)).toEqual([
      { id: 'counterattack-row', edgeId: 'counterattack' },
    ])
    expect(getDependentEdges(current, removedHindrance, dependencyDefinitions)).toEqual([
      { id: 'clear-conscience-row', edgeId: 'clear-conscience' },
    ])
  })

  it('does not report edges that were already invalid before the proposed change', () => {
    const current = characterWithEdges([
      { id: 'invalid-row', edgeId: 'counterattack' },
    ])
    current.skills = []
    const proposed = { ...current, name: 'Changed name' }

    expect(getDependentEdges(current, proposed, dependencyDefinitions)).toEqual([])
  })
})