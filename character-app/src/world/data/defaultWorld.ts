import type { Locale } from '@/i18n/types'
import { enDefaultWorld } from '@/i18n/locales/en/defaults'
import { ruDefaultWorld } from '@/i18n/locales/ru/defaults'
import type { World, WorldEntityType, WorldPosition } from '@/world/types'

function cloneWorld(world: World): World {
  return {
    ...world,
    settingRules: { ...world.settingRules },
    worldHandbook: [...world.worldHandbook],
    entities: world.entities.map(entity => ({
      ...entity,
      tags: [...entity.tags],
      position: { ...entity.position },
    })),
    relationships: world.relationships.map(relationship => ({ ...relationship })),
  }
}

export function getDefaultWorld(locale: Locale): World {
  return cloneWorld(locale === 'ru' ? ruDefaultWorld : enDefaultWorld)
}

export function createWorldEntity(
  type: WorldEntityType,
  title: string,
  position: WorldPosition = { x: 180, y: 180 },
) {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    summary: '',
    description: '',
    tags: [],
    position,
  }
}

export const defaultWorld: World = ruDefaultWorld
