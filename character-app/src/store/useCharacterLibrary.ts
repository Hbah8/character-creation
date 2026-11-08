import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character } from '@/types/character'
import {
  SavedCharacterApiError,
  savedCharacterApi,
} from '@/services/savedCharacterApi'
import type { SavedCharacterRecord } from '@/services/savedCharacterApi'

interface LibraryState {
  accountId: string
  entries: SavedCharacterRecord[]
  loading: boolean
  error: SavedCharacterApiError | null
}

interface CurrentRecord {
  accountId: string
  id: string
  version: number
  updatedAt: string
}

function toApiError(error: unknown): SavedCharacterApiError {
  return error instanceof SavedCharacterApiError
    ? error
    : new SavedCharacterApiError('unavailable')
}

export function useCharacterLibrary(accountId: string) {
  const accountScope = useRef(accountId)
  accountScope.current = accountId
  const requestSequence = useRef(0)
  const [state, setState] = useState<LibraryState>({
    accountId,
    entries: [],
    loading: true,
    error: null,
  })
  const stateRef = useRef(state)
  stateRef.current = state
  const [current, setCurrent] = useState<CurrentRecord | null>(null)
  const isCurrentAccount = state.accountId === accountId

  useEffect(() => {
    let active = true
    const sequence = ++requestSequence.current
    void savedCharacterApi.list().then(entries => {
      if (active && accountScope.current === accountId && sequence === requestSequence.current) {
        setState({ accountId, entries, loading: false, error: null })
      }
    }).catch(error => {
      if (active && accountScope.current === accountId && sequence === requestSequence.current) {
        setState({ accountId, entries: [], loading: false, error: toApiError(error) })
      }
    })
    return () => {
      active = false
    }
  }, [accountId])

  const reload = useCallback(async () => {
    const scope = accountId
    const sequence = ++requestSequence.current
    setState(previous => previous.accountId === scope
      ? { ...previous, loading: true, error: null }
      : previous)
    try {
      const entries = await savedCharacterApi.list()
      if (accountScope.current === scope && sequence === requestSequence.current) {
        setState({ accountId: scope, entries, loading: false, error: null })
      }
    } catch (error) {
      if (accountScope.current === scope && sequence === requestSequence.current) {
        setState(previous => previous.accountId === scope
          ? { ...previous, loading: false, error: toApiError(error) }
          : previous)
      }
    }
  }, [accountId])

  const save = useCallback(async (character: Character): Promise<SavedCharacterRecord> => {
    const scope = accountId
    const currentRecord = current?.accountId === scope ? current : null
    ++requestSequence.current
    try {
      const saved = currentRecord
        ? await savedCharacterApi.update(currentRecord.id, currentRecord.version, character)
        : await savedCharacterApi.create(character)
      if (accountScope.current === scope) {
        ++requestSequence.current
        setCurrent({ accountId: scope, id: saved.id, version: saved.version, updatedAt: saved.updatedAt })
        setState(previous => {
          if (previous.accountId !== scope) return previous
          const entries = previous.entries.filter(entry => entry.id !== saved.id)
          return { ...previous, entries: [saved, ...entries], error: null }
        })
      }
      return saved
    } catch (error) {
      if (accountScope.current === scope) {
        const apiError = toApiError(error)
        setState(previous => previous.accountId === scope
          ? { ...previous, error: apiError }
          : previous)
      }
      throw error
    }
  }, [accountId, current])

  const loadById = useCallback(async (id: string): Promise<SavedCharacterRecord> => {
    const scope = accountId
    const sequence = ++requestSequence.current
    const shouldReloadLibrary = stateRef.current.accountId === scope && stateRef.current.loading
    try {
      const record = await savedCharacterApi.get(id)
      if (accountScope.current === scope && sequence === requestSequence.current) {
        ++requestSequence.current
        setCurrent({ accountId: scope, id: record.id, version: record.version, updatedAt: record.updatedAt })
        setState(previous => {
          if (previous.accountId !== scope) return previous
          const entries = previous.entries.filter(entry => entry.id !== record.id)
          return { ...previous, entries: [record, ...entries], error: null }
        })
        if (shouldReloadLibrary) void reload()
      }
      return record
    } catch (error) {
      if (accountScope.current === scope) {
        const apiError = toApiError(error)
        setState(previous => previous.accountId === scope
          ? { ...previous, error: apiError }
          : previous)
      }
      throw error
    }
  }, [accountId, reload])

  const remove = useCallback(async (id: string, version: number): Promise<void> => {
    const scope = accountId
    ++requestSequence.current
    try {
      await savedCharacterApi.delete(id, version)
      if (accountScope.current === scope) {
        ++requestSequence.current
        setState(previous => previous.accountId === scope
          ? { ...previous, entries: previous.entries.filter(entry => entry.id !== id), error: null }
          : previous)
        setCurrent(previous => previous?.accountId === scope && previous.id === id ? null : previous)
      }
    } catch (error) {
      if (accountScope.current === scope) {
        const apiError = toApiError(error)
        setState(previous => previous.accountId === scope
          ? { ...previous, error: apiError }
          : previous)
      }
      throw error
    }
  }, [accountId])

  const markNew = useCallback(() => {
    setCurrent(previous => previous?.accountId === accountId ? null : previous)
  }, [accountId])

  const currentRecord = current?.accountId === accountId ? current : null
  const error = isCurrentAccount ? state.error : null

  return {
    entries: isCurrentAccount ? state.entries : [],
    loading: !isCurrentAccount || state.loading,
    error,
    currentId: currentRecord?.id ?? null,
    currentVersion: currentRecord?.version ?? null,
    currentUpdatedAt: currentRecord?.updatedAt ?? null,
    save,
    loadById,
    remove,
    markNew,
    reload,
  }
}
