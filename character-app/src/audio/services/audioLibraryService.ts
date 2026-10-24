import type { AudioAsset, WorldAudio } from '@/world/types'

export function addAudioAssets(
  audio: WorldAudio,
  assets: AudioAsset[],
): WorldAudio {
  const existingIds = new Set(audio.assets.map(asset => asset.id))
  for (const asset of assets) {
    if (existingIds.has(asset.id)) {
      throw new Error(`audio.asset.duplicateId:${asset.id}`)
    }
    existingIds.add(asset.id)
  }

  return {
    ...audio,
    assets: [...audio.assets, ...assets],
  }
}

export function removeAudioAsset(audio: WorldAudio, assetId: string): WorldAudio {
  const removedTrackIds = new Set(
    audio.tracks
      .filter(track => track.assetId === assetId)
      .map(track => track.id),
  )

  return {
    ...audio,
    assets: audio.assets.filter(asset => asset.id !== assetId),
    tracks: audio.tracks.filter(track => !removedTrackIds.has(track.id)),
    scenes: audio.scenes.map(scene => ({
      ...scene,
      trackIds: scene.trackIds.filter(trackId => !removedTrackIds.has(trackId)),
    })),
  }
}

export function getTracksToStopForSceneActivation(
  activeTrackIds: string[],
  targetTrackIds: string[],
): string[] {
  const targetIds = new Set(targetTrackIds)
  return activeTrackIds.filter(trackId => !targetIds.has(trackId))
}

export function duckOtherAudioTracks(audio: WorldAudio, foregroundTrackId: string): WorldAudio {
  return {
    ...audio,
    tracks: audio.tracks.map(track => (
      track.id === foregroundTrackId
        ? track
        : { ...track, defaultVolume: Number((track.defaultVolume * 0.3).toFixed(2)) }
    )),
  }
}
