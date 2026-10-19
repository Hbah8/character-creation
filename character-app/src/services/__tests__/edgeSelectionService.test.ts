import { describe, expect, it } from 'vitest'
import { filterEdgeSelectionOptions, getEdgeSelectionOptions, getUnmetRequirements } from '@/services/edgeSelectionService'
import type { Character } from '@/types/character'
import type { Edge } from '@/types/handbook'

const CHARACTER: Character = {
  sheetTitle: '',
  callsign: 'Scout',
  name: '',
  rank: 'Novice',
  role: '',
  fileNo: '',
  portraitUrl: '',
  agility: 'd6',
  strength: 'd6',
  smarts: 'd6',
  spirit: 'd6',
  vigor: 'd6',
  pace: '',
  parry: '',
  toughness: '',
  armor: '',
  skills: [],
  edges: [],
  hindrances: [],
  weapons: [],
  gear: [],
  specialRules: [],
  powers: [],
  notes: '',
}

const EDGES: Edge[] = [
  {
    id: 'wild-strike',
    name: 'Wild Strike',
    description: '',
    type: 'Combat',
    requirements: { allOf: [{ type: 'wildCard' }] },
  },
  {
    id: 'arcane-strike',
    name: 'Arcane Strike',
    description: '',
    type: 'Power',
    requirements: {
      allOf: [{ type: 'edge', edgeId: 'misticheskiy-dar', arcaneBackground: 'magic' }],
    },
  },
]

const RANKED_EDGES: Edge[] = [
  { id: 'novice-edge', name: 'Novice Edge', description: '', type: 'Background', requirements: { allOf: [{ type: 'rank', minimum: 'Novice' }] } },
  { id: 'seasoned-edge', name: 'Seasoned Edge', description: '', type: 'Combat', requirements: { allOf: [{ type: 'rank', minimum: 'Seasoned' }] } },
  { id: 'veteran-edge', name: 'Veteran Edge', description: '', type: 'Professional', requirements: { allOf: [{ type: 'rank', minimum: 'Veteran' }] } },
  { id: 'heroic-edge', name: 'Heroic Edge', description: '', type: 'WildCard', requirements: { allOf: [{ type: 'rank', minimum: 'Heroic' }] } },
]

describe('getEdgeSelectionOptions', () => {
  it('recognizes selected hindrance handbook references in edge requirements', () => {
    const edge: Edge = {
      id: 'clear-conscience',
      name: 'Clear Conscience',
      description: '',
      type: 'Social',
      requirements: { allOf: [{ type: 'hindrance', hindranceId: 'code-of-honor' }] },
    }

    expect(getUnmetRequirements(edge, {
      ...CHARACTER,
      hindrances: [{
        id: 'code-of-honor-row',
        hindranceId: 'code-of-honor',
        name: 'Code of Honor',
        severity: 'minor',
        description: '',
      }],
    })).toEqual([])
  })

  it('reports Wild Card and Arcane Background requirements against the current character', () => {
    const ordinary = getEdgeSelectionOptions(EDGES, {
      ...CHARACTER,
      isWildCard: false,
    })

    expect(ordinary).toEqual(expect.arrayContaining([
      expect.objectContaining({
        edge: expect.objectContaining({ id: 'wild-strike' }),
        isAvailable: false,
        unmetRequirements: [{ type: 'wildCard' }],
      }),
      expect.objectContaining({
        edge: expect.objectContaining({ id: 'arcane-strike' }),
        isAvailable: false,
        unmetRequirements: [{ type: 'edge', edgeId: 'misticheskiy-dar' }],
      }),
    ]))

    const mysticWithoutBackground = getEdgeSelectionOptions(EDGES, {
      ...CHARACTER,
      isWildCard: true,
      edges: [{ id: 'gift-row', edgeId: 'misticheskiy-dar' }],
    })

    expect(mysticWithoutBackground).toEqual(expect.arrayContaining([
      expect.objectContaining({
        edge: expect.objectContaining({ id: 'arcane-strike' }),
        isAvailable: false,
        unmetRequirements: [{ type: 'arcaneBackground', minimum: 'magic' }],
      }),
    ]))

    const arcaneWildCard = getEdgeSelectionOptions(EDGES, {
      ...CHARACTER,
      isWildCard: true,
      arcaneBackground: 'Magic',
      edges: [{ id: 'gift-row', edgeId: 'misticheskiy-dar' }],
    })

    expect(arcaneWildCard).toEqual(expect.arrayContaining([
      expect.objectContaining({ edge: expect.objectContaining({ id: 'wild-strike' }), isAvailable: true }),
      expect.objectContaining({ edge: expect.objectContaining({ id: 'arcane-strike' }), isAvailable: true }),
    ]))
  })

  it('filters the picker by edge type and hides unavailable edges unless requested', () => {
    const options = getEdgeSelectionOptions(EDGES, { ...CHARACTER, isWildCard: false })

    expect(filterEdgeSelectionOptions(options, { type: 'Combat', showUnavailable: false }))
      .toEqual([])
    expect(filterEdgeSelectionOptions(options, { type: 'Combat', showUnavailable: true }))
      .toEqual([expect.objectContaining({ edge: expect.objectContaining({ id: 'wild-strike' }) })])
    expect(filterEdgeSelectionOptions(options, { type: 'Power', showUnavailable: true }))
      .toEqual([expect.objectContaining({ edge: expect.objectContaining({ id: 'arcane-strike' }) })])
  })

  it('keeps lower-rank edges available as a character advances', () => {
    const options = getEdgeSelectionOptions(RANKED_EDGES, { ...CHARACTER, rank: 'Veteran' })
    const availability = new Map(options.map(option => [option.edge.id, option.isAvailable]))

    expect(availability.get('novice-edge')).toBe(true)
    expect(availability.get('seasoned-edge')).toBe(true)
    expect(availability.get('veteran-edge')).toBe(true)
    expect(availability.get('heroic-edge')).toBe(false)
  })
})