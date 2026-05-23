import { describe, expect, it } from 'vitest'
import {
  addRaceToWorld,
  removeRaceFromWorld,
  updateRaceInWorld,
} from '@/world/store/useWorldStore'
import type { Race, World } from '@/world/types'

function validWorld(): World {
  return {
    schemaVersion: 1,
    name: 'Race World',
    summary: '',
    settingRules: { skillPointsBudget: 12, attributePointsBudget: 5 },
    races: [
      {
        id: 'human',
        name: 'Human',
        description: 'Adaptable people.',
        abilities: [{ id: 'free-edge' }],
        size: 0,
      },
    ],
    worldHandbook: [],
    entities: [],
    relationships: [],
  }
}

const elf: Race = {
  id: 'elf',
  name: 'Elf',
  description: 'Keen senses.',
  abilities: [{ id: 'low-light-vision' }],
  size: 0,
}

describe('world race store helpers', () => {
  it('appends races, including duplicate ids', () => {
    const world = validWorld()

    const nextWorld = addRaceToWorld(world, { ...elf, id: 'human' })

    expect(nextWorld.races).toHaveLength(2)
    expect(nextWorld.races.map(race => race.id)).toEqual(['human', 'human'])
    expect(world.races).toHaveLength(1)
  })

  it('updates a matching race and leaves unknown ids unchanged', () => {
    const world = addRaceToWorld(validWorld(), elf)

    const updated = updateRaceInWorld(world, 'elf', { description: 'Ancient lineage.', size: -1 })
    const unchanged = updateRaceInWorld(updated, 'missing', { name: 'Missing' })

    expect(updated.races.find(race => race.id === 'elf')).toMatchObject({
      id: 'elf',
      name: 'Elf',
      description: 'Ancient lineage.',
      size: -1,
    })
    expect(unchanged.races).toEqual(updated.races)
  })

  it('removes a matching race and leaves unknown ids unchanged', () => {
    const world = addRaceToWorld(validWorld(), elf)

    const removed = removeRaceFromWorld(world, 'human')
    const unchanged = removeRaceFromWorld(removed, 'missing')

    expect(removed.races.map(race => race.id)).toEqual(['elf'])
    expect(unchanged.races).toEqual(removed.races)
  })
})
