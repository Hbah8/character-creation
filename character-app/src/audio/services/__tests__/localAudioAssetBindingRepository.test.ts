import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearLocalAudioAssetBindings,
  deleteLocalAudioAssetBinding,
  getLocalAudioAssetBinding,
  saveLocalAudioAssetBinding,
} from '@/audio/services/localAudioAssetBindingRepository'

describe('localAudioAssetBindingRepository', () => {
  beforeEach(async () => {
    await clearLocalAudioAssetBindings()
  })

  it('persists a browser-local file binding by asset id', async () => {
    const fileHandle = { kind: 'file', name: 'cave-ambience.mp3' } as FileSystemFileHandle

    await saveLocalAudioAssetBinding({
      assetId: 'asset-1',
      fileHandle,
      lastVerifiedAt: '2026-10-24T00:00:00.000Z',
    })

    await expect(getLocalAudioAssetBinding('asset-1')).resolves.toEqual({
      assetId: 'asset-1',
      fileHandle,
      lastVerifiedAt: '2026-10-24T00:00:00.000Z',
    })
  })

  it('does not return bindings that were never saved', async () => {
    await expect(getLocalAudioAssetBinding('missing')).resolves.toBeUndefined()
  })

  it('deletes only the browser-local binding for an asset', async () => {
    await saveLocalAudioAssetBinding({
      assetId: 'asset-1',
      fileHandle: { kind: 'file', name: 'cave-ambience.mp3' } as FileSystemFileHandle,
      lastVerifiedAt: '2026-10-24T00:00:00.000Z',
    })

    await deleteLocalAudioAssetBinding('asset-1')

    await expect(getLocalAudioAssetBinding('asset-1')).resolves.toBeUndefined()
  })
})
