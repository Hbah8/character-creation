import type { FeatureParameters, StoredHandbookEntry } from '@/types/handbook'

export const WORLD_SCHEMA_VERSION = 1
export const WORLD_AUDIO_SCHEMA_VERSION = 1

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

export interface SettingRules {
  skillPointsBudget: number
  attributePointsBudget: number
  racePointsBudget?: number
}

export const SWADE_DEFAULTS: SettingRules = {
  skillPointsBudget: 12,
  attributePointsBudget: 5,
  racePointsBudget: 2,
}

export const SWADE_SIZE_MIN = -4
export const SWADE_SIZE_MAX = 20

export interface WorldPosition {
  x: number
  y: number
}

export interface RacialAbilityRef {
  id: string
  repeatCount?: number
  parameters?: FeatureParameters
}

export interface Race {
  id: string
  name: string
  description: string
  abilities: RacialAbilityRef[]
  size: number
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

export interface AudioAsset {
  id: string
  filename: string
  mediaType: string
  byteLength: number
  durationSeconds?: number
  checksum?: string
}

export interface AudioTrack {
  id: string
  assetId: string
  name: string
  loop: boolean
  defaultVolume: number
  presetId?: string
  muted?: boolean
  transition?: AudioTransition
}

export const AUDIO_TRANSITIONS = [
  'instant',
  'fade-short',
  'fade-medium',
  'fade-long',
] as const

export type AudioTransition = typeof AUDIO_TRANSITIONS[number]

export interface AudioScene {
  id: string
  name: string
  trackIds: string[]
}

export interface AudioPreset {
  id: string
  name: string
}

export interface WorldAudio {
  schemaVersion: typeof WORLD_AUDIO_SCHEMA_VERSION
  assets: AudioAsset[]
  tracks: AudioTrack[]
  scenes: AudioScene[]
  presets: AudioPreset[]
}

export function createEmptyWorldAudio(): WorldAudio {
  return {
    schemaVersion: WORLD_AUDIO_SCHEMA_VERSION,
    assets: [],
    tracks: [],
    scenes: [],
    presets: [],
  }
}

export interface World {
  schemaVersion: typeof WORLD_SCHEMA_VERSION
  name: string
  summary: string
  settingRules: SettingRules
  races: Race[]
  entities: WorldEntity[]
  relationships: WorldRelationship[]
  worldHandbook: StoredHandbookEntry[]
  audio?: WorldAudio
}
