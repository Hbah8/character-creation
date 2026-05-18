import type {
  World,
  WorldEntity,
  WorldEntityType,
  WorldRelationship,
  WorldRelationshipType,
  SettingRules,
} from '@/world/types'
import {
  WORLD_ENTITY_TYPES,
  WORLD_RELATIONSHIP_TYPES,
  WORLD_SCHEMA_VERSION,
} from '@/world/types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isEntityType(value: unknown): value is WorldEntityType {
  return WORLD_ENTITY_TYPES.includes(value as WorldEntityType)
}

function isRelationshipType(value: unknown): value is WorldRelationshipType {
  return WORLD_RELATIONSHIP_TYPES.includes(value as WorldRelationshipType)
}

function validateSettingRules(raw: unknown): SettingRules {
  const defaults: SettingRules = { skillPointsBudget: 12, attributePointsBudget: 5 }
  if (raw === undefined || raw === null) return defaults
  if (!isObject(raw)) {
    throw new Error('validation.world.settingRulesNotObject')
  }
  const skillPointsBudget = isNumber(raw.skillPointsBudget) && raw.skillPointsBudget > 0
    ? raw.skillPointsBudget
    : defaults.skillPointsBudget
  const attributePointsBudget = isNumber(raw.attributePointsBudget) && raw.attributePointsBudget > 0
    ? raw.attributePointsBudget
    : defaults.attributePointsBudget
  return { skillPointsBudget, attributePointsBudget }
}

function validateTags(value: unknown, id: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`validation.world.entityTagsNotArray:${id}`)
  }
  if (!value.every(isString)) {
    throw new Error(`validation.world.entityTagNotString:${id}`)
  }
  return value
}

function validateEntity(raw: unknown, index: number): WorldEntity {
  if (!isObject(raw)) {
    throw new Error(`validation.world.entityNotObject:${index}`)
  }
  if (!isString(raw.id) || raw.id.trim() === '') {
    throw new Error(`validation.world.entityMissingId:${index}`)
  }
  if (!isEntityType(raw.type)) {
    throw new Error(`validation.world.entityInvalidType:${raw.id}`)
  }
  if (!isString(raw.title)) {
    throw new Error(`validation.world.entityMissingTitle:${raw.id}`)
  }
  if (!isString(raw.summary)) {
    throw new Error(`validation.world.entityMissingSummary:${raw.id}`)
  }
  if (!isString(raw.description)) {
    throw new Error(`validation.world.entityMissingDescription:${raw.id}`)
  }
  if (!isObject(raw.position) || !isNumber(raw.position.x) || !isNumber(raw.position.y)) {
    throw new Error(`validation.world.entityInvalidPosition:${raw.id}`)
  }

  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    summary: raw.summary,
    description: raw.description,
    tags: validateTags(raw.tags, raw.id),
    position: {
      x: raw.position.x,
      y: raw.position.y,
    },
  }
}

function validateRelationship(
  raw: unknown,
  index: number,
  entityIds: Set<string>,
): WorldRelationship {
  if (!isObject(raw)) {
    throw new Error(`validation.world.relationshipNotObject:${index}`)
  }
  if (!isString(raw.id) || raw.id.trim() === '') {
    throw new Error(`validation.world.relationshipMissingId:${index}`)
  }
  if (!isString(raw.sourceId) || !entityIds.has(raw.sourceId)) {
    throw new Error(`validation.world.relationshipInvalidSource:${raw.id}`)
  }
  if (!isString(raw.targetId) || !entityIds.has(raw.targetId)) {
    throw new Error(`validation.world.relationshipInvalidTarget:${raw.id}`)
  }
  if (raw.sourceId === raw.targetId) {
    throw new Error(`validation.world.relationshipSelfLoop:${raw.id}`)
  }
  if (!isRelationshipType(raw.type)) {
    throw new Error(`validation.world.relationshipInvalidType:${raw.id}`)
  }
  if (!isString(raw.label)) {
    throw new Error(`validation.world.relationshipMissingLabel:${raw.id}`)
  }
  if (!isString(raw.description)) {
    throw new Error(`validation.world.relationshipMissingDescription:${raw.id}`)
  }

  return {
    id: raw.id,
    sourceId: raw.sourceId,
    targetId: raw.targetId,
    type: raw.type,
    label: raw.label,
    description: raw.description,
  }
}

export function validateWorldImport(raw: unknown): World {
  if (!isObject(raw)) {
    throw new Error('validation.world.notAnObject')
  }
  if (raw.schemaVersion !== WORLD_SCHEMA_VERSION) {
    throw new Error('validation.world.unsupportedSchemaVersion')
  }
  if (!isString(raw.name)) {
    throw new Error('validation.world.missingName')
  }
  if (!isString(raw.summary)) {
    throw new Error('validation.world.missingSummary')
  }
  if (!Array.isArray(raw.entities)) {
    throw new Error('validation.world.entitiesNotArray')
  }
  if (!Array.isArray(raw.relationships)) {
    throw new Error('validation.world.relationshipsNotArray')
  }

  const entities = raw.entities.map(validateEntity)
  const entityIds = new Set<string>()
  for (const entity of entities) {
    if (entityIds.has(entity.id)) {
      throw new Error(`validation.world.duplicateEntityId:${entity.id}`)
    }
    entityIds.add(entity.id)
  }

  const relationships = raw.relationships.map((item, index) =>
    validateRelationship(item, index, entityIds)
  )
  const relationshipIds = new Set<string>()
  for (const relationship of relationships) {
    if (relationshipIds.has(relationship.id)) {
      throw new Error(`validation.world.duplicateRelationshipId:${relationship.id}`)
    }
    relationshipIds.add(relationship.id)
  }

  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    name: raw.name,
    summary: raw.summary,
    settingRules: validateSettingRules(raw.settingRules),
    entities,
    relationships,
  }
}
