import { describe, expect, it } from 'vitest'
import { verifyLocalAudioAsset } from '@/audio/services/localAudioAssetSource'

function createFileHandle(getFile: () => Promise<File>): FileSystemFileHandle {
  return {
    kind: 'file',
    name: 'test-audio-file',
    getFile,
    createWritable: async () => {
      throw new Error('Not implemented in test handle')
    },
    isSameEntry: async () => false,
  }
}

describe('verifyLocalAudioAsset', () => {
  it('reports available when the bound file remains readable', async () => {
    const status = await verifyLocalAudioAsset(
      { filename: 'cave-ambience.mp3', byteLength: 1024 },
      createFileHandle(async () => ({ name: 'cave-ambience.mp3', size: 1024 } as File)),
    )

    expect(status).toBe('available')
  })

  it('reports missing when the source file was removed outside the application', async () => {
    const status = await verifyLocalAudioAsset(
      { filename: 'cave-ambience.mp3', byteLength: 1024 },
      createFileHandle(async () => {
        throw new DOMException('The file no longer exists.', 'NotFoundError')
      }),
    )

    expect(status).toBe('missing')
  })

  it('reports changed when the selected source file no longer matches its metadata', async () => {
    const status = await verifyLocalAudioAsset(
      { filename: 'cave-ambience.mp3', byteLength: 1024 },
      createFileHandle(async () => ({ name: 'cave-ambience.mp3', size: 2048 } as File)),
    )

    expect(status).toBe('changed')
  })
})
