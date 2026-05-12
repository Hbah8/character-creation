import type { Character } from '@/types/character'
import { validateCharacterImport } from './validateImport'

export interface LibraryEntry {
  id: string
  savedAt: string
  character: Character
}

const LIBRARY_KEY = 'swade-characters'

export function loadLibrary(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item: unknown) => {
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
        const character = validateCharacterImport(entry.character)
        return [{ id: entry.id as string, savedAt: entry.savedAt as string, character }]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

function persist(entries: LibraryEntry[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(entries))
}

export function saveEntry(id: string, character: Character): void {
  const entries = loadLibrary()
  const idx = entries.findIndex(e => e.id === id)
  const entry: LibraryEntry = { id, savedAt: new Date().toISOString(), character }
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  persist(entries)
}

export function deleteEntry(id: string): void {
  const entries = loadLibrary().filter(e => e.id !== id)
  persist(entries)
}
