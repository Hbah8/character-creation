export const MAP_GRID_COLORS = ['#ffffff', '#171717', '#f4b942', '#56c4d2'] as const

export type MapGridColor = typeof MAP_GRID_COLORS[number]

export interface MapGridSettings {
  enabled: boolean
  cellSize: number
  color: MapGridColor
}

export const DEFAULT_MAP_GRID_SETTINGS: MapGridSettings = {
  enabled: true,
  cellSize: 48,
  color: '#ffffff',
}

export const MAP_ROTATIONS = [0, 90, 180, 270] as const
export type MapRotation = typeof MAP_ROTATIONS[number]
export type MapRotationDirection = 'clockwise' | 'counterclockwise'

export interface StoredMap {
  id: string
  worldId: string
  filename: string
  mediaType: string
  byteLength: number
  image: Blob
  gridSettings: MapGridSettings
  rotation: MapRotation
  addedAt: string
}
