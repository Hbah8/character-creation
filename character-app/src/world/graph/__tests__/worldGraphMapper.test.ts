import { describe, expect, it } from 'vitest'
import { applyEntityPosition, worldToGraph } from '@/world/graph/worldGraphMapper'
import type { World } from '@/world/types'

const world: World = {
  schemaVersion: 1,
  name: 'Test World',
  summary: '',
  settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
  entities: [
    {
      id: 'location-1',
      type: 'location',
      title: 'Fort Locke',
      summary: 'Border fort',
      description: '',
      tags: [],
      position: { x: 10, y: 20 },
    },
    {
      id: 'npc-1',
      type: 'npc',
      title: 'Marshal Vale',
      summary: '',
      description: '',
      tags: [],
      position: { x: 200, y: 80 },
    },
  ],
  relationships: [
    {
      id: 'relationship-1',
      sourceId: 'npc-1',
      targetId: 'location-1',
      type: 'located_in',
      label: 'stationed at',
      description: '',
    },
  ],
}

describe('worldGraphMapper', () => {
  it('maps world entities and relationships to React Flow nodes and edges', () => {
    const graph = worldToGraph(world, 'npc-1', 'relationship-1')

    expect(graph.nodes).toHaveLength(2)
    expect(graph.edges).toHaveLength(1)
    expect(graph.nodes[0]).toMatchObject({
      id: 'location-1',
      position: { x: 10, y: 20 },
      data: { label: 'Fort Locke', type: 'location' },
    })
    expect(graph.nodes[1].selected).toBe(true)
    expect(graph.edges[0]).toMatchObject({
      id: 'relationship-1',
      source: 'npc-1',
      target: 'location-1',
      label: 'stationed at',
      selected: true,
    })
  })

  it('updates an entity position without mutating the original world object', () => {
    const nextWorld = applyEntityPosition(world, 'npc-1', { x: 360, y: 240 })

    expect(nextWorld.entities[1].position).toEqual({ x: 360, y: 240 })
    expect(world.entities[1].position).toEqual({ x: 200, y: 80 })
  })
})
