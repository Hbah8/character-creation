import type { WorldEntityType, WorldRelationshipType } from '@/world/types'

export type WorldEntityLabelKey = `world.entityTypes.${WorldEntityType}`
export type WorldRelationshipLabelKey = `world.relationshipTypes.${WorldRelationshipType}`

export const WORLD_ENTITY_LABEL_KEYS = {
  location: 'world.entityTypes.location',
  faction: 'world.entityTypes.faction',
  npc: 'world.entityTypes.npc',
  event: 'world.entityTypes.event',
  item: 'world.entityTypes.item',
  note: 'world.entityTypes.note',
} satisfies Record<WorldEntityType, WorldEntityLabelKey>

export const WORLD_RELATIONSHIP_LABEL_KEYS = {
  controls: 'world.relationshipTypes.controls',
  belongs_to: 'world.relationshipTypes.belongs_to',
  located_in: 'world.relationshipTypes.located_in',
  ally: 'world.relationshipTypes.ally',
  enemy: 'world.relationshipTypes.enemy',
  knows: 'world.relationshipTypes.knows',
  caused: 'world.relationshipTypes.caused',
  mentions: 'world.relationshipTypes.mentions',
  custom: 'world.relationshipTypes.custom',
} satisfies Record<WorldRelationshipType, WorldRelationshipLabelKey>
