import { describe, expect, it } from 'vitest'
import { createAudioAssetMetadata } from '@/audio/services/audioAssetImportService'

describe('createAudioAssetMetadata', () => {
  it('creates portable metadata for a selected MP3 file', () => {
    const metadata = createAudioAssetMetadata(
      { name: 'cave-ambience.mp3', type: 'audio/mpeg', size: 1024 },
      'asset-1',
    )

    expect(metadata).toEqual({
      id: 'asset-1',
      filename: 'cave-ambience.mp3',
      mediaType: 'audio/mpeg',
      byteLength: 1024,
    })
  })

  it('accepts selected WAV and MP4 files', () => {
    expect(createAudioAssetMetadata(
      { name: 'wind.wav', type: 'audio/wav', size: 1 },
      'asset-wav',
    ).mediaType).toBe('audio/wav')

    expect(createAudioAssetMetadata(
      { name: 'battle.mp4', type: 'audio/mp4', size: 1 },
      'asset-mp4',
    ).mediaType).toBe('audio/mp4')
  })

  it('rejects files without a supported audio extension', () => {
    expect(() => createAudioAssetMetadata(
      { name: 'campaign-notes.pdf', type: 'application/pdf', size: 1 },
      'asset-1',
    )).toThrow('audio.asset.unsupportedFileType')
  })
})
