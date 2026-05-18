import { describe, expect, it } from 'vitest'
import { validateWorldImport } from '@/world/services/validateWorldImport'
import type { World } from '@/world/types'

function validWorld(): World {
  return {
    schemaVersion: 1,
    name: 'Deadlands Frontier',
    summary: 'A compact campaign frame.',
    settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
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
})
