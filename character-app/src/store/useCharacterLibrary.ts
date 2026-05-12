import { useState, useCallback } from 'react'
import type { Character } from '@/types/character'
import type { LibraryEntry } from '@/services/libraryService'
import { loadLibrary, saveEntry, deleteEntry } from '@/services/libraryService'

export function useCharacterLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>(() => loadLibrary())
  const [currentId, setCurrentId] = useState<string | null>(null)

  const save = useCallback((character: Character): string => {
    const id = currentId ?? crypto.randomUUID()
    saveEntry(id, character)
    setCurrentId(id)
    setEntries(loadLibrary())
    return id
  }, [currentId])

  const loadById = useCallback((id: string): Character => {
    const entries = loadLibrary()
    const entry = entries.find(e => e.id === id)
    if (!entry) throw new Error(`Library entry not found: ${id}`)
    setCurrentId(id)
    setEntries(entries)
    return entry.character
  }, [])

  const remove = useCallback((id: string): void => {
    deleteEntry(id)
    setEntries(loadLibrary())
    setCurrentId(prev => (prev === id ? null : prev))
  }, [])

  const markNew = useCallback(() => {
    setCurrentId(null)
  }, [])

  return { entries, currentId, save, loadById, remove, markNew }
}
