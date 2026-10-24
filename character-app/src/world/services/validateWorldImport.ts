import type {
  World,
  WorldEntity,
  WorldEntityType,
  WorldRelationship,
  WorldRelationshipType,
  SettingRules,
  Race,
  RacialAbilityRef,
  AudioAsset,
  AudioPreset,
  AudioScene,
  AudioTrack,
  WorldAudio,
} from '@/world/types'
import {
  createEmptyWorldAudio,
  WORLD_AUDIO_SCHEMA_VERSION,
  WORLD_ENTITY_TYPES,
  WORLD_RELATIONSHIP_TYPES,
  WORLD_SCHEMA_VERSION,
} from '@/world/types'
import type { HandbookCategory, HandbookOverride, StoredHandbookEntry } from '@/types/handbook'
import { validateHandbookEntry } from '@/handbooks/services/validateHandbookEntry'

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
  const defaults: SettingRules = { skillPointsBudget: 12, attributePointsBudget: 5, racePointsBudget: 2 }
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
  const racePointsBudget = isNumber(raw.racePointsBudget) && raw.racePointsBudget > 0
    ? raw.racePointsBudget
    : defaults.racePointsBudget
  return { skillPointsBudget, attributePointsBudget, racePointsBudget }
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

const HANDBOOK_CATEGORIES: readonly HandbookCategory[] = [
  'edge', 'hindrance', 'skill', 'weapon', 'gear', 'power', 'mount', 'racialAbility',
]

function isHandbookCategory(value: unknown): value is HandbookCategory {
  return HANDBOOK_CATEGORIES.includes(value as HandbookCategory)
}

function validateWorldHandbook(raw: unknown): StoredHandbookEntry[] {
  if (!Array.isArray(raw)) return []
  const valid: StoredHandbookEntry[] = []
  const identities = new Set<string>()
  for (const item of raw) {
    if (!isObject(item)) continue
    let entry: StoredHandbookEntry
    if ('mode' in item) {
      entry = validateHandbookEntry(item)
    } else {
      if (!isString(item.id) || item.id.trim() === '') continue
      if (!isHandbookCategory(item.category)) continue
      entry = item as HandbookOverride
    }
    const category = 'handbookCategory' in entry ? entry.handbookCategory : entry.category
    const identity = `${category}:${entry.id}`
    if (identities.has(identity)) {
      throw new Error(`validation.world.duplicateHandbookEntry:${identity}`)
    }
    identities.add(identity)
    valid.push(entry)
  }
  return valid
}

function validateRacialAbilityRef(raw: unknown, raceId: string): RacialAbilityRef {
  if (!isObject(raw)) {
    throw new Error(`validation.world.racialAbilityRefNotObject:${raceId}`)
  }
  if (!isString(raw.id) || raw.id.trim() === '') {
    throw new Error(`validation.world.racialAbilityRefMissingId:${raceId}`)
  }
  const repeatCount = isNumber(raw.repeatCount) && raw.repeatCount > 0
    ? Math.floor(raw.repeatCount)
    : 1
  const parameters = isObject(raw.parameters) ? { ...raw.parameters } : {}

  if (raw.id === 'agile') {
    return {
      id: 'attribute-bonus',
      repeatCount,
      parameters: { attributeId: 'agility', ...parameters },
    }
  }

  return { id: raw.id, repeatCount, parameters }
}

function validateRacialAbilityRefs(raw: unknown, raceId: string): RacialAbilityRef[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    throw new Error(`validation.world.raceAbilitiesNotArray:${raceId}`)
  }
  return raw.map(item => validateRacialAbilityRef(item, raceId))
}

function validateRace(raw: unknown, index: number): Race {
  if (!isObject(raw)) {
    throw new Error(`validation.world.raceNotObject:${index}`)
  }
  if (!isString(raw.id) || raw.id.trim() === '') {
    throw new Error(`validation.world.raceMissingId:${index}`)
  }
  if (!isString(raw.name) || raw.name.trim() === '') {
    throw new Error(`validation.world.raceMissingName:${raw.id}`)
  }
  if (raw.description !== undefined && !isString(raw.description)) {
    throw new Error(`validation.world.raceMissingDescription:${raw.id}`)
  }
  const abilities = validateRacialAbilityRefs(raw.abilities, raw.id)

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    abilities,
    size: isNumber(raw.size) ? raw.size : 0,
  }
}

function validateRaces(raw: unknown): Race[] {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) {
    throw new Error('validation.world.racesNotArray')
  }
  return raw.map(validateRace)
}

function validateAudioId(value: unknown, errorCode: string): string {
  if (!isString(value) || value.trim() === '') {
    throw new Error(errorCode)
  }
  return value
}

function validateAudioAssets(raw: unknown): AudioAsset[] {
  if (!Array.isArray(raw)) {
    throw new Error('validation.world.audioAssetsNotArray')
  }
  const ids = new Set<string>()
  return raw.map((item, index) => {
    if (!isObject(item)) throw new Error(`validation.world.audioAssetNotObject:${index}`)
    const id = validateAudioId(item.id, `validation.world.audioAssetMissingId:${index}`)
    if (ids.has(id)) throw new Error(`validation.world.duplicateAudioAssetId:${id}`)
    ids.add(id)
    if (!isString(item.filename) || item.filename.trim() === '') {
      throw new Error(`validation.world.audioAssetMissingFilename:${id}`)
    }
    if (!isString(item.mediaType) || item.mediaType.trim() === '') {
      throw new Error(`validation.world.audioAssetMissingMediaType:${id}`)
    }
    if (!isNumber(item.byteLength) || item.byteLength < 0) {
      throw new Error(`validation.world.audioAssetInvalidByteLength:${id}`)
    }
    if (item.durationSeconds !== undefined && (!isNumber(item.durationSeconds) || item.durationSeconds < 0)) {
      throw new Error(`validation.world.audioAssetInvalidDuration:${id}`)
    }
    if (item.checksum !== undefined && !isString(item.checksum)) {
      throw new Error(`validation.world.audioAssetInvalidChecksum:${id}`)
    }
    return {
      id,
      filename: item.filename,
      mediaType: item.mediaType,
      byteLength: item.byteLength,
      ...(item.durationSeconds === undefined ? {} : { durationSeconds: item.durationSeconds }),
      ...(item.checksum === undefined ? {} : { checksum: item.checksum }),
    }
  })
}

function validateAudioPresets(raw: unknown): AudioPreset[] {
  if (!Array.isArray(raw)) throw new Error('validation.world.audioPresetsNotArray')
  const ids = new Set<string>()
  return raw.map((item, index) => {
    if (!isObject(item)) throw new Error(`validation.world.audioPresetNotObject:${index}`)
    const id = validateAudioId(item.id, `validation.world.audioPresetMissingId:${index}`)
    if (ids.has(id)) throw new Error(`validation.world.duplicateAudioPresetId:${id}`)
    ids.add(id)
    if (!isString(item.name) || item.name.trim() === '') {
      throw new Error(`validation.world.audioPresetMissingName:${id}`)
    }
    return { id, name: item.name }
  })
}

function validateAudioTracks(raw: unknown, assetIds: Set<string>, presetIds: Set<string>): AudioTrack[] {
  if (!Array.isArray(raw)) throw new Error('validation.world.audioTracksNotArray')
  const ids = new Set<string>()
  return raw.map((item, index) => {
    if (!isObject(item)) throw new Error(`validation.world.audioTrackNotObject:${index}`)
    const id = validateAudioId(item.id, `validation.world.audioTrackMissingId:${index}`)
    if (ids.has(id)) throw new Error(`validation.world.duplicateAudioTrackId:${id}`)
    ids.add(id)
    if (!isString(item.assetId) || !assetIds.has(item.assetId)) {
      throw new Error(`validation.world.audioUnknownAsset:${String(item.assetId)}`)
    }
    if (!isString(item.name) || item.name.trim() === '') {
      throw new Error(`validation.world.audioTrackMissingName:${id}`)
    }
    if (typeof item.loop !== 'boolean') throw new Error(`validation.world.audioTrackInvalidLoop:${id}`)
    if (!isNumber(item.defaultVolume) || item.defaultVolume < 0 || item.defaultVolume > 1) {
      throw new Error(`validation.world.audioTrackInvalidVolume:${id}`)
    }
    if (
      item.presetId !== undefined
      && (
        !isString(item.presetId)
        || (!presetIds.has(item.presetId) && !['underwater', 'tunnel', 'distortion'].includes(item.presetId))
      )
    ) {
      throw new Error(`validation.world.audioUnknownPreset:${String(item.presetId)}`)
    }
    return {
      id,
      assetId: item.assetId,
      name: item.name,
      loop: item.loop,
      defaultVolume: item.defaultVolume,
      ...(item.presetId === undefined ? {} : { presetId: item.presetId }),
    }
  })
}

function validateAudioScenes(raw: unknown, trackIds: Set<string>): AudioScene[] {
  if (!Array.isArray(raw)) throw new Error('validation.world.audioScenesNotArray')
  const ids = new Set<string>()
  return raw.map((item, index) => {
    if (!isObject(item)) throw new Error(`validation.world.audioSceneNotObject:${index}`)
    const id = validateAudioId(item.id, `validation.world.audioSceneMissingId:${index}`)
    if (ids.has(id)) throw new Error(`validation.world.duplicateAudioSceneId:${id}`)
    ids.add(id)
    if (!isString(item.name) || item.name.trim() === '') {
      throw new Error(`validation.world.audioSceneMissingName:${id}`)
    }
    if (!Array.isArray(item.trackIds) || !item.trackIds.every(isString)) {
      throw new Error(`validation.world.audioSceneTrackIdsNotArray:${id}`)
    }
    for (const trackId of item.trackIds) {
      if (!trackIds.has(trackId)) throw new Error(`validation.world.audioUnknownTrack:${trackId}`)
    }
    return { id, name: item.name, trackIds: item.trackIds }
  })
}

function validateWorldAudio(raw: unknown): WorldAudio {
  if (raw === undefined) return createEmptyWorldAudio()
  if (!isObject(raw) || raw.schemaVersion !== WORLD_AUDIO_SCHEMA_VERSION) {
    throw new Error('validation.world.audioUnsupportedSchemaVersion')
  }
  const assets = validateAudioAssets(raw.assets)
  const presets = validateAudioPresets(raw.presets)
  const tracks = validateAudioTracks(
    raw.tracks,
    new Set(assets.map(asset => asset.id)),
    new Set(presets.map(preset => preset.id)),
  )
  const scenes = validateAudioScenes(raw.scenes, new Set(tracks.map(track => track.id)))
  return { schemaVersion: WORLD_AUDIO_SCHEMA_VERSION, assets, tracks, scenes, presets }
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
    races: validateRaces(raw.races),
    worldHandbook: validateWorldHandbook(raw.worldHandbook),
    audio: validateWorldAudio(raw.audio),
    entities,
    relationships,
  }
}
