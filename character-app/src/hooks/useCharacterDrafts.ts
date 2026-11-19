import { useCallback, useEffect, useState } from 'react'
import {
  CHARACTER_DRAFTS_CHANGED,
  deleteCharacterDraft,
  listCharacterDrafts,
} from '@/services/characterDraftRepository'
import type { CharacterDraft } from '@/services/characterDraftRepository'
import { DraftStorageError } from '@/services/entityDraftStore'
import type { DraftStorageErrorCode } from '@/services/entityDraftStore'

export function useCharacterDrafts(accountId: string) {
  const [state, setState] = useState<{
    accountId: string
    drafts: CharacterDraft[]
    error: DraftStorageErrorCode | 'changed' | null
    loading: boolean
  }>({ accountId, drafts: [], error: null, loading: true })
  const refresh = useCallback(() => {
    let active = true
    void listCharacterDrafts(accountId).then(({ drafts, corrupt }) => {
      if (active) setState({ accountId, drafts, error: corrupt ? 'corrupt' : null, loading: false })
    }).catch(error => {
      if (active) setState({
        accountId, drafts: [], loading: false,
        error: error instanceof DraftStorageError ? error.code : 'unavailable',
      })
    })
    return () => { active = false }
  }, [accountId])

  useEffect(() => {
    let cancel = refresh()
    const reload = () => {
      cancel()
      cancel = refresh()
    }
    window.addEventListener(CHARACTER_DRAFTS_CHANGED, reload)
    window.addEventListener('focus', reload)
    return () => {
      cancel()
      window.removeEventListener(CHARACTER_DRAFTS_CHANGED, reload)
      window.removeEventListener('focus', reload)
    }
  }, [refresh])

  const remove = useCallback(async (draft: CharacterDraft) => {
    try {
      const deleted = await deleteCharacterDraft(draft)
      if (!deleted) {
        setState(previous => previous.accountId === accountId
          ? { ...previous, error: 'changed' }
          : previous)
      }
    } catch (error) {
      setState(previous => previous.accountId === accountId
        ? { ...previous, error: error instanceof DraftStorageError ? error.code : 'unavailable' }
        : previous)
    }
  }, [accountId])

  return {
    drafts: state.accountId === accountId ? state.drafts : [],
    error: state.accountId === accountId ? state.error : null,
    loading: state.accountId !== accountId || state.loading,
    remove,
  }
}
