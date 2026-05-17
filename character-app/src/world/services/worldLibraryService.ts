import type { World } from '@/world/types'
import { validateWorldImport } from '@/world/services/validateWorldImport'

export interface WorldLibraryEntry {
  id: string
  savedAt: string
  world: World
}

const WORLD_LIBRARY_KEY = 'swade-worlds'

export function loadWorldLibrary(): WorldLibraryEntry[] {
  try {
    const raw = localStorage.getItem(WORLD_LIBRARY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap(item => {
      try {
        if (
          typeof item !== 'object' ||
          item === null ||
          typeof (item as Record<string, unknown>).id !== 'string' ||
          typeof (item as Record<string, unknown>).savedAt !== 'string'
        ) {
          return []
        }
        const entry = item as Record<string, unknown>
        return [{
          id: entry.id as string,
          savedAt: entry.savedAt as string,
          world: validateWorldImport(entry.world),
        }]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

function persistWorldLibrary(entries: WorldLibraryEntry[]): void {
  localStorage.setItem(WORLD_LIBRARY_KEY, JSON.stringify(entries))
}

export function saveWorldEntry(id: string, world: World): void {
  const entries = loadWorldLibrary()
  const idx = entries.findIndex(entry => entry.id === id)
  const entry: WorldLibraryEntry = { id, savedAt: new Date().toISOString(), world }
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  persistWorldLibrary(entries)
}

export function deleteWorldEntry(id: string): void {
  persistWorldLibrary(loadWorldLibrary().filter(entry => entry.id !== id))
}
