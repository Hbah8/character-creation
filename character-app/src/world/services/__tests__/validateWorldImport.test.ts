import { describe, expect, it } from 'vitest'
import { validateWorldImport } from '@/world/services/validateWorldImport'
import type { World } from '@/world/types'

function validWorld(): World {
  return {
    schemaVersion: 1,
    name: 'Deadlands Frontier',
    summary: 'A compact campaign frame.',
    settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
    worldHandbook: [],
    entities: [
      {
        id: 'loc-1',
        type: 'location',
        title: 'Junction',
        summary: 'Rail town',
        description: 'A dusty station town.',
        tags: ['frontier'],
        position: { x: 100, y: 120 },
      },
      {
        id: 'fac-1',
        type: 'faction',
        title: 'Rail Crew',
        summary: 'Workers and guards',
        description: '',
        tags: [],
        position: { x: 320, y: 120 },
      },
    ],
    relationships: [
      {
        id: 'rel-1',
        sourceId: 'fac-1',
        targetId: 'loc-1',
        type: 'located_in',
        label: '',
        description: 'Mostly based in the station yard.',
      },
    ],
  }
}

describe('validateWorldImport', () => {
  it('accepts a valid world and preserves markdown, tags, and positions', () => {
    const world = validateWorldImport(validWorld())

    expect(world.name).toBe('Deadlands Frontier')
    expect(world.entities[0].description).toBe('A dusty station town.')
    expect(world.entities[0].tags).toEqual(['frontier'])
    expect(world.entities[0].position).toEqual({ x: 100, y: 120 })
    expect(world.relationships[0].type).toBe('located_in')
  })

  it('rejects non-object JSON', () => {
    expect(() => validateWorldImport(null)).toThrow('validation.world.notAnObject')
  })

  it('rejects duplicate entity ids', () => {
    const world = validWorld()
    world.entities[1] = { ...world.entities[1], id: 'loc-1' }

    expect(() => validateWorldImport(world)).toThrow('validation.world.duplicateEntityId:loc-1')
  })

  it('rejects relationships pointing at missing entities', () => {
    const world = validWorld()
    world.relationships[0] = { ...world.relationships[0], targetId: 'missing' }

    expect(() => validateWorldImport(world)).toThrow('validation.world.relationshipInvalidTarget:rel-1')
  })

  describe('worldHandbook', () => {
    it('defaults to [] when worldHandbook is absent', () => {
      const raw = { ...validWorld(), worldHandbook: undefined }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toEqual([])
    })

    it('defaults to [] when worldHandbook is not an array', () => {
      const raw = { ...validWorld(), worldHandbook: 'invalid' }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toEqual([])
    })

    it('passes through valid worldHandbook entries', () => {
      const raw = {
        ...validWorld(),
        worldHandbook: [
          { id: 'level-headed', category: 'edge', name: 'Level Headed (House Rule)' },
        ],
      }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toHaveLength(1)
      expect(world.worldHandbook[0].id).toBe('level-headed')
      expect(world.worldHandbook[0].category).toBe('edge')
    })

    it('filters out entries with an unknown category', () => {
      const raw = {
        ...validWorld(),
        worldHandbook: [
          { id: 'good-entry', category: 'edge', name: 'Valid' },
          { id: 'bad-entry', category: 'unknown_category', name: 'Invalid' },
        ],
      }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toHaveLength(1)
      expect(world.worldHandbook[0].id).toBe('good-entry')
    })

    it('filters out entries missing an id', () => {
      const raw = {
        ...validWorld(),
        worldHandbook: [
          { category: 'edge', name: 'No id entry' },
          { id: 'good-entry', category: 'edge', name: 'Valid' },
        ],
      }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toHaveLength(1)
      expect(world.worldHandbook[0].id).toBe('good-entry')
    })

    it('filters out entries with a blank id', () => {
      const raw = {
        ...validWorld(),
        worldHandbook: [
          { id: '  ', category: 'edge', name: 'Blank id' },
          { id: 'good-entry', category: 'hindrance', name: 'Valid', type: 'Minor' },
        ],
      }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toHaveLength(1)
      expect(world.worldHandbook[0].id).toBe('good-entry')
    })

    it('filters out non-object entries', () => {
      const raw = {
        ...validWorld(),
        worldHandbook: [
          'not an object',
          42,
          { id: 'good-entry', category: 'weapon', name: 'Pistol', damage: '2d6' },
        ],
      }
      const world = validateWorldImport(raw)

      expect(world.worldHandbook).toHaveLength(1)
      expect(world.worldHandbook[0].id).toBe('good-entry')
    })
  })
})
