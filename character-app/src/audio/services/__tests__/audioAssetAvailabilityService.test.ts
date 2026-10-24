import { describe, expect, it } from 'vitest'
import { getAudioAssetAvailability } from '@/audio/services/audioAssetAvailabilityService'

describe('getAudioAssetAvailability', () => {
  it('reports local availability for each registered asset', async () => {
    const statuses = await getAudioAssetAvailability(
      [
        { id: 'available', filename: 'cave.mp3', mediaType: 'audio/mpeg', byteLength: 100 },
        { id: 'missing', filename: 'wind.wav', mediaType: 'audio/wav', byteLength: 200 },
      ],
      async assetId => {
        if (assetId === 'available') {
          return {
            assetId,
            fileHandle: createFileHandle(async () => ({ name: 'cave.mp3', size: 100 } as File)),
            lastVerifiedAt: '2026-10-24T00:00:00.000Z',
          }
        }
        return undefined
      },
    )

    expect(statuses).toEqual({
      available: 'available',
      missing: 'missing',
    })
  })
})

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
