import { useCallback, useState } from 'react'
import type { World } from '@/world/types'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'
import {
  deleteWorldEntry,
  loadWorldLibrary,
  saveWorldEntry,
} from '@/world/services/worldLibraryService'

export function useWorldLibrary() {
  const [entries, setEntries] = useState<WorldLibraryEntry[]>(() => loadWorldLibrary())
  const [currentId, setCurrentId] = useState<string | null>(null)

  const save = useCallback((world: World): string => {
    const id = currentId ?? crypto.randomUUID()
    saveWorldEntry(id, world)
    setCurrentId(id)
    setEntries(loadWorldLibrary())
    return id
  }, [currentId])

  const loadById = useCallback((id: string): World => {
    const entries = loadWorldLibrary()
    const entry = entries.find(item => item.id === id)
    if (!entry) throw new Error(`World entry not found: ${id}`)
    setCurrentId(id)
    setEntries(entries)
    return entry.world
  }, [])

  const remove = useCallback((id: string): void => {
    deleteWorldEntry(id)
    setEntries(loadWorldLibrary())
    setCurrentId(prev => (prev === id ? null : prev))
  }, [])

  const markNew = useCallback(() => {
    setCurrentId(null)
  }, [])

  return { entries, currentId, save, loadById, remove, markNew }
}
