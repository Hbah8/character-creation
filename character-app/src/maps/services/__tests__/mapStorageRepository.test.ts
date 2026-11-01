import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addMap,
  getMap,
  listWorldMaps,
  removeMap,
  resetMapGridSettings,
  rotateMap,
  updateMapGridSettings,
} from '@/maps/services/mapStorageRepository'
import { DEFAULT_MAP_GRID_SETTINGS } from '@/maps/types'

describe('mapStorageRepository', () => {
  beforeEach(async () => {
    for (const worldId of ['world-1', 'world-2']) {
      const maps = await listWorldMaps(worldId)
      await Promise.all(maps.map(map => removeMap(worldId, map.id)))
    }
  })

  it('persists image blobs and default grid settings by world', async () => {
    const blob = new Blob(['map-image'], { type: 'image/png' })

    const map = await addMap('world-1', 'village.png', blob)

    expect(map.gridSettings).toEqual(DEFAULT_MAP_GRID_SETTINGS)
    expect(map.rotation).toBe(0)
    await expect(getMap('world-1', map.id)).resolves.toMatchObject({
      filename: 'village.png',
      image: blob,
    })
    await expect(listWorldMaps('world-1')).resolves.toEqual([map])
    await expect(listWorldMaps('world-2')).resolves.toEqual([])
  })

  it('updates and resets only the selected map grid settings', async () => {
    const first = await addMap('world-1', 'village.png', new Blob(['one']))
    const second = await addMap('world-1', 'dungeon.png', new Blob(['two']))
    const customized = { enabled: false, cellSize: 72, color: '#171717' as const }
    const otherMapSettings = { enabled: true, cellSize: 80, color: '#f4b942' as const }

    await updateMapGridSettings('world-1', first.id, customized)
    await updateMapGridSettings('world-1', second.id, otherMapSettings)
    await resetMapGridSettings('world-1', first.id)

    await expect(getMap('world-1', first.id)).resolves.toMatchObject({
      gridSettings: DEFAULT_MAP_GRID_SETTINGS,
    })
    await expect(getMap('world-1', second.id)).resolves.toMatchObject({
      gridSettings: otherMapSettings,
    })

    await resetMapGridSettings('world-1', second.id)
    await expect(getMap('world-1', first.id)).resolves.toMatchObject({
      gridSettings: DEFAULT_MAP_GRID_SETTINGS,
    })
  })

  it('removes a map without affecting maps in another world', async () => {
    const first = await addMap('world-1', 'village.png', new Blob(['one']))
    await addMap('world-2', 'castle.png', new Blob(['two']))

    await removeMap('world-1', first.id)

    await expect(getMap('world-1', first.id)).resolves.toBeUndefined()
    await expect(listWorldMaps('world-2')).resolves.toHaveLength(1)
  })

  it('rotates a map in 90 degree steps and persists its angle independently', async () => {
    const first = await addMap('world-1', 'village.png', new Blob(['one']))
    const second = await addMap('world-1', 'dungeon.png', new Blob(['two']))
    await updateMapGridSettings('world-1', first.id, {
      enabled: false,
      cellSize: 64,
      color: '#56c4d2',
    })

    await expect(rotateMap('world-1', first.id, 'clockwise')).resolves.toBe(90)
    await rotateMap('world-1', first.id, 'clockwise')
    await rotateMap('world-1', first.id, 'counterclockwise')

    await expect(getMap('world-1', first.id)).resolves.toMatchObject({
      rotation: 90,
      gridSettings: { enabled: false, cellSize: 64, color: '#56c4d2' },
    })
    await expect(getMap('world-1', second.id)).resolves.toMatchObject({ rotation: 0 })

    await rotateMap('world-1', first.id, 'counterclockwise')
    await expect(getMap('world-1', first.id)).resolves.toMatchObject({ rotation: 0 })
  })
})
