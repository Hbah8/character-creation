export const WORLD_SCHEMA_VERSION = 1

export const WORLD_ENTITY_TYPES = [
  'location',
  'faction',
  'npc',
  'event',
  'item',
  'note',
] as const

export type WorldEntityType = typeof WORLD_ENTITY_TYPES[number]

export const WORLD_RELATIONSHIP_TYPES = [
  'controls',
  'belongs_to',
  'located_in',
  'ally',
  'enemy',
  'knows',
  'caused',
  'mentions',
  'custom',
] as const

export type WorldRelationshipType = typeof WORLD_RELATIONSHIP_TYPES[number]

export interface WorldPosition {
  x: number
  y: number
}

export interface WorldEntity {
  id: string
  type: WorldEntityType
  title: string
  summary: string
  description: string
  tags: string[]
  position: WorldPosition
}

export interface WorldRelationship {
  id: string
  sourceId: string
  targetId: string
  type: WorldRelationshipType
  label: string
  description: string
}

export interface World {
  schemaVersion: typeof WORLD_SCHEMA_VERSION
  name: string
  summary: string
  entities: WorldEntity[]
  relationships: WorldRelationship[]
}
