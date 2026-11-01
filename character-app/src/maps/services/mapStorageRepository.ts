import { DEFAULT_MAP_GRID_SETTINGS } from '@/maps/types'
import {
  DEFAULT_MAP_ZOOM,
  MAP_ZOOM_STEP,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from '@/maps/types'
import type {
  MapGridSettings,
  MapRotation,
  MapRotationDirection,
  MapZoomDirection,
  StoredMap,
} from '@/maps/types'

const DATABASE_NAME = 'swade-maps'
const DATABASE_VERSION = 1
const STORE_NAME = 'maps'
const WORLD_INDEX = 'worldId'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error ?? new Error('maps.storage.openFailed'))
    request.onblocked = () => reject(new Error('maps.storage.openBlocked'))
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: ['worldId', 'id'] })
        store.createIndex(WORLD_INDEX, WORLD_INDEX, { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, setResult: (value: T) => void) => void,
): Promise<T> {
  return openDatabase().then(database => new Promise((resolve, reject) => {
    let result: T
    let settled = false
    const transaction = database.transaction(STORE_NAME, mode)
    const close = () => database.close()
    const fail = (error: Error | DOMException | null) => {
      if (settled) return
      settled = true
      close()
      reject(error ?? new Error('maps.storage.transactionFailed'))
    }

    transaction.oncomplete = () => {
      if (settled) return
      settled = true
      close()
      resolve(result)
    }
    transaction.onerror = () => fail(transaction.error)
    transaction.onabort = () => fail(transaction.error)

    try {
      operation(transaction.objectStore(STORE_NAME), value => {
        result = value
      })
    } catch (error) {
      transaction.abort()
      fail(error instanceof DOMException ? error : new Error('maps.storage.transactionFailed'))
    }
  }))
}

export async function addMap(worldId: string, filename: string, image: Blob): Promise<StoredMap> {
  if (!worldId.trim() || !filename.trim() || image.size === 0) {
    throw new Error('maps.storage.invalidMap')
  }

  const map: StoredMap = {
    id: crypto.randomUUID(),
    worldId,
    filename,
    mediaType: image.type,
    byteLength: image.size,
    image,
    gridSettings: { ...DEFAULT_MAP_GRID_SETTINGS },
    rotation: 0,
    zoom: DEFAULT_MAP_ZOOM,
    addedAt: new Date().toISOString(),
  }

  await runTransaction<void>('readwrite', store => {
    store.add(map)
  })
  return map
}

export function listWorldMaps(worldId: string): Promise<StoredMap[]> {
  return runTransaction<StoredMap[]>('readonly', (store, setResult) => {
    const request = store.index(WORLD_INDEX).getAll(IDBKeyRange.only(worldId))
    request.onsuccess = () => {
      setResult((request.result as StoredMap[]).sort((left, right) =>
        left.addedAt.localeCompare(right.addedAt),
      ))
    }
  })
}

export function getMap(worldId: string, mapId: string): Promise<StoredMap | undefined> {
  return runTransaction<StoredMap | undefined>('readonly', (store, setResult) => {
    const request = store.get([worldId, mapId])
    request.onsuccess = () => setResult(request.result as StoredMap | undefined)
  })
}

export function updateMapGridSettings(
  worldId: string,
  mapId: string,
  gridSettings: MapGridSettings,
): Promise<void> {
  return runTransaction<void>('readwrite', store => {
    const request = store.get([worldId, mapId])
    request.onsuccess = () => {
      const map = request.result as StoredMap | undefined
      if (!map) {
        store.transaction.abort()
        return
      }
      store.put({ ...map, gridSettings: { ...gridSettings } })
    }
  })
}

export function resetMapGridSettings(worldId: string, mapId: string): Promise<void> {
  return updateMapGridSettings(worldId, mapId, DEFAULT_MAP_GRID_SETTINGS)
}

export function rotateMap(
  worldId: string,
  mapId: string,
  direction: MapRotationDirection,
): Promise<MapRotation> {
  return runTransaction<MapRotation>('readwrite', (store, setResult) => {
    const request = store.get([worldId, mapId])
    request.onsuccess = () => {
      const map = request.result as StoredMap | undefined
      if (!map) {
        store.transaction.abort()
        return
      }
      const currentRotation = map.rotation ?? 0
      const increment = direction === 'clockwise' ? 90 : 270
      const rotation = ((currentRotation + increment) % 360) as MapRotation
      store.put({ ...map, rotation })
      setResult(rotation)
    }
  })
}

export function zoomMap(
  worldId: string,
  mapId: string,
  direction: MapZoomDirection,
): Promise<number> {
  return runTransaction<number>('readwrite', (store, setResult) => {
    const request = store.get([worldId, mapId])
    request.onsuccess = () => {
      const map = request.result as StoredMap | undefined
      if (!map) {
        store.transaction.abort()
        return
      }
      const currentZoom = map.zoom ?? DEFAULT_MAP_ZOOM
      const increment = direction === 'in' ? MAP_ZOOM_STEP : -MAP_ZOOM_STEP
      const zoom = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, currentZoom + increment))
      store.put({ ...map, zoom })
      setResult(zoom)
    }
  })
}

export function removeMap(worldId: string, mapId: string): Promise<void> {
  return runTransaction<void>('readwrite', store => {
    store.delete([worldId, mapId])
  })
}
