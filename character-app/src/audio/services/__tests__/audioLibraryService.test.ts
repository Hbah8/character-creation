import { describe, expect, it } from 'vitest'
import {
  addAudioAssets,
  getTracksToStopForSceneActivation,
  duckOtherAudioTracks,
  removeAudioAsset,
} from '@/audio/services/audioLibraryService'
import { createEmptyWorldAudio } from '@/world/types'

describe('addAudioAssets', () => {
  it('adds assets without changing the existing audio configuration', () => {
    const existing = createEmptyWorldAudio()
    const updated = addAudioAssets(existing, [{
      id: 'asset-1',
      filename: 'cave-ambience.mp3',
      mediaType: 'audio/mpeg',
      byteLength: 1024,
    }])

    expect(updated.assets).toHaveLength(1)
    expect(existing.assets).toEqual([])
  })

  it('rejects asset ids already registered in the World', () => {
    const existing = addAudioAssets(createEmptyWorldAudio(), [{
      id: 'asset-1',
      filename: 'cave-ambience.mp3',
      mediaType: 'audio/mpeg',
      byteLength: 1024,
    }])

    expect(() => addAudioAssets(existing, [{
      id: 'asset-1',
      filename: 'different-file.mp3',
      mediaType: 'audio/mpeg',
      byteLength: 2048,
    }])).toThrow('audio.asset.duplicateId:asset-1')
  })

  it('removes an asset and the tracks and scenes that depend on it', () => {
    const audio = {
      ...createEmptyWorldAudio(),
      assets: [
        { id: 'asset-1', filename: 'cave.mp3', mediaType: 'audio/mpeg', byteLength: 1 },
        { id: 'asset-2', filename: 'wind.wav', mediaType: 'audio/wav', byteLength: 1 },
      ],
      tracks: [
        { id: 'track-1', assetId: 'asset-1', name: 'Cave', loop: true, defaultVolume: 1 },
        { id: 'track-2', assetId: 'asset-2', name: 'Wind', loop: true, defaultVolume: 1 },
      ],
      scenes: [{ id: 'scene-1', name: 'Cave', trackIds: ['track-1', 'track-2'] }],
    }

    expect(removeAudioAsset(audio, 'asset-1')).toMatchObject({
      assets: [{ id: 'asset-2' }],
      tracks: [{ id: 'track-2' }],
      scenes: [{ id: 'scene-1', trackIds: ['track-2'] }],
    })
  })

  it('stops only outgoing tracks when activating another scene', () => {
    expect(getTracksToStopForSceneActivation(
      ['rain', 'tavern'],
      ['tavern', 'combat'],
    )).toEqual(['rain'])
  })

  it('reduces and persists the volume of every other track', () => {
    const audio = {
      ...createEmptyWorldAudio(),
      tracks: [
        { id: 'music', assetId: 'music-asset', name: 'Music', loop: true, defaultVolume: 1 },
        { id: 'effect', assetId: 'effect-asset', name: 'Effect', loop: false, defaultVolume: 0.8 },
      ],
    }

    expect(duckOtherAudioTracks(audio, 'effect')).toMatchObject({
      tracks: [
        { id: 'music', defaultVolume: 0.3 },
        { id: 'effect', defaultVolume: 0.8 },
      ],
    })
  })
})
