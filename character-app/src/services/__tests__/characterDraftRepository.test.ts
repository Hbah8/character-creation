import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { enDefaultCharacter } from '@/i18n/locales/en/defaults'
import {
  confirmCharacterDraft,
  deleteCharacterDraft,
  listCharacterDrafts,
  writeCharacterDraft,
} from '@/services/characterDraftRepository'

describe('character draft repository', () => {
  it('updates a reopened draft without creating another entry', async () => {
    const accountId = crypto.randomUUID()
    const first = await writeCharacterDraft({
      accountId, entityId: 'new-character', isNew: true,
      baseVersion: null, baseUpdatedAt: null, character: enDefaultCharacter,
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    const updated = await writeCharacterDraft({
      ...first, expectedRevision: first.revision,
      character: { ...first.character, callsign: 'Reopened' },
    })

    expect(updated.draftId).toBe(first.draftId)
    expect(updated.revision).toBe(first.revision + 1)
    expect(await listCharacterDrafts(accountId)).toEqual({ drafts: [updated], corrupt: false })
    expect(await listCharacterDrafts('another-account')).toEqual({ drafts: [], corrupt: false })
  })

  it('preserves diverging changes when two tabs edit the same revision', async () => {
    const accountId = crypto.randomUUID()
    const first = await writeCharacterDraft({
      accountId, entityId: 'new-character', isNew: true,
      baseVersion: null, baseUpdatedAt: null, character: enDefaultCharacter,
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    const [tabA, tabB] = await Promise.all([
      writeCharacterDraft({ ...first, expectedRevision: first.revision,
        character: { ...first.character, callsign: 'Tab A' } }),
      writeCharacterDraft({ ...first, expectedRevision: first.revision,
        character: { ...first.character, callsign: 'Tab B' } }),
    ])

    expect(tabA.draftId).not.toBe(tabB.draftId)
    expect((await listCharacterDrafts(accountId)).drafts.map(draft => draft.character.callsign).sort())
      .toEqual(['Tab A', 'Tab B'])
  })

  it('removes only the confirmed revision and retains newer edits', async () => {
    const accountId = crypto.randomUUID()
    const first = await writeCharacterDraft({
      accountId, entityId: 'character', isNew: true,
      baseVersion: null, baseUpdatedAt: null, character: enDefaultCharacter,
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    const later = await writeCharacterDraft({
      ...first, expectedRevision: first.revision,
      character: { ...first.character, callsign: 'While saving' },
    })

    await confirmCharacterDraft(first, { id: 'character', version: 1, updatedAt: '2026-11-20T00:00:00Z' })
    expect((await listCharacterDrafts(accountId)).drafts).toMatchObject([{
      draftId: later.draftId, revision: later.revision, isNew: false, baseVersion: 1,
      character: { callsign: 'While saving' },
    }])
    await confirmCharacterDraft(later, { id: 'character', version: 1, updatedAt: '2026-11-20T00:00:00Z' })
    expect((await listCharacterDrafts(accountId)).drafts).toEqual([])
  })

  it('deletes only the selected unchanged version', async () => {
    const accountId = crypto.randomUUID()
    const draft = await writeCharacterDraft({
      accountId, entityId: 'character', isNew: true,
      baseVersion: null, baseUpdatedAt: null, character: enDefaultCharacter,
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    const newer = await writeCharacterDraft({
      ...draft, expectedRevision: draft.revision,
      character: { ...draft.character, name: 'New edit' },
    })
    expect(await deleteCharacterDraft(draft)).toBe(false)
    expect((await listCharacterDrafts(accountId)).drafts).toEqual([newer])
    expect(await deleteCharacterDraft(newer)).toBe(true)
    expect((await listCharacterDrafts(accountId)).drafts).toEqual([])
  })

  it('does not store embedded media in drafts', async () => {
    const accountId = crypto.randomUUID()
    const draft = await writeCharacterDraft({
      accountId, entityId: 'character', isNew: true,
      baseVersion: null, baseUpdatedAt: null,
      character: { ...enDefaultCharacter, portraitUrl: 'data:image/png;base64,private' },
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    expect(draft.character.portraitUrl).toBe('')
    expect((await listCharacterDrafts(accountId)).drafts[0].character.portraitUrl).toBe('')
  })

  it('reports a damaged record while keeping valid drafts available', async () => {
    const accountId = crypto.randomUUID()
    const valid = await writeCharacterDraft({
      accountId, entityId: 'character', isNew: true,
      baseVersion: null, baseUpdatedAt: null, character: enDefaultCharacter,
      draftId: crypto.randomUUID(), expectedRevision: null,
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('swade-character-drafts')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const database = request.result
        const tx = database.transaction('drafts', 'readwrite')
        tx.objectStore('drafts').put({
          ...valid, draftId: 'damaged', character: { ...valid.character, callsign: { invalid: true } },
        })
        tx.oncomplete = () => { database.close(); resolve() }
        tx.onabort = () => reject(tx.error)
      }
    })

    const result = await listCharacterDrafts(accountId)
    expect(result).toEqual({ drafts: [valid], corrupt: true })
    await expect(writeCharacterDraft({
      ...valid, draftId: 'damaged', expectedRevision: null,
    })).rejects.toMatchObject({ code: 'corrupt' })
  })
})
