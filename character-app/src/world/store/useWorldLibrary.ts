import { useCallback, useEffect, useState } from 'react'
import type { World } from '@/world/types'
import type { WorldLibraryEntry } from '@/world/services/worldLibraryService'
import {
  deleteWorldEntry,
  loadWorldLibrary,
  saveWorldEntry,
} from '@/world/services/worldLibraryService'

const ACTIVE_WORLD_KEY = 'active-world-id'
const ACTIVE_WORLD_EVENT = 'active-world-changed'

export function useWorldLibrary() {
  const [entries, setEntries] = useState<WorldLibraryEntry[]>(() => loadWorldLibrary())
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [activeWorldId, setActiveWorldIdState] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_WORLD_KEY)
  )

  useEffect(() => {
    const handler = () => setActiveWorldIdState(localStorage.getItem(ACTIVE_WORLD_KEY))
    window.addEventListener(ACTIVE_WORLD_EVENT, handler)
    return () => window.removeEventListener(ACTIVE_WORLD_EVENT, handler)
  }, [])

  const setActiveWorldId = useCallback((id: string | null) => {
    if (id === null) {
      localStorage.removeItem(ACTIVE_WORLD_KEY)
    } else {
      localStorage.setItem(ACTIVE_WORLD_KEY, id)
    }
    setActiveWorldIdState(id)
    window.dispatchEvent(new CustomEvent(ACTIVE_WORLD_EVENT))
  }, [])

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

  return { entries, currentId, save, loadById, remove, markNew, activeWorldId, setActiveWorldId }
}
