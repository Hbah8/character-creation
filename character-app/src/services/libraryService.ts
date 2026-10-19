import type { Character } from '@/types/character'
import { validateCharacterImport } from './validateImport'
import { loadWorldLibrary, type WorldLibraryEntry } from '@/world/services/worldLibraryService'

export interface LibraryEntry {
  id: string
  savedAt: string
  character: Character
}

const LIBRARY_KEY = 'swade-characters'

export function loadLibrary(worlds: readonly WorldLibraryEntry[] = loadWorldLibrary()): LibraryEntry[] {
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
        const rawCharacter = entry.character as Record<string, unknown>
        const worldId = typeof rawCharacter.worldId === 'string' ? rawCharacter.worldId : undefined
        const worldHandbook = worlds.find(world => world.id === worldId)?.world.worldHandbook ?? []
        const character = validateCharacterImport(entry.character, worldHandbook)
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

export function saveEntry(id: string, character: Character, worlds: readonly WorldLibraryEntry[] = loadWorldLibrary()): void {
  const entries = loadLibrary(worlds)
  const idx = entries.findIndex(e => e.id === id)
  const entry: LibraryEntry = { id, savedAt: new Date().toISOString(), character }
  if (idx >= 0) {
    entries[idx] = entry
  } else {
    entries.push(entry)
  }
  persist(entries)
}

export function deleteEntry(id: string, worlds: readonly WorldLibraryEntry[] = loadWorldLibrary()): void {
  const entries = loadLibrary(worlds).filter(e => e.id !== id)
  persist(entries)
}
