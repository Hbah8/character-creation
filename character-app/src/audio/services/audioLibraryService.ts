import type { AudioAsset, AudioSceneTrackSettings, AudioTrack, WorldAudio } from '@/world/types'

type AudioSceneTrackChanges = Partial<Pick<AudioTrack, 'loop' | 'defaultVolume' | 'muted' | 'presetId' | 'transition'>>

function toSceneTrackSettings(track: AudioTrack): AudioSceneTrackSettings {
  return {
    loop: track.loop,
    defaultVolume: track.defaultVolume,
    muted: track.muted ?? false,
    presetId: track.presetId ?? null,
    transition: track.transition ?? null,
  }
}

export function getAudioSceneTrack(
  audio: WorldAudio,
  sceneId: string | null,
  trackId: string,
): AudioTrack | undefined {
  const track = audio.tracks.find(item => item.id === trackId)
  if (!track) return undefined
  if (!sceneId) return track

  const scene = audio.scenes.find(item => item.id === sceneId)
  const settings = scene?.trackSettings?.[trackId]
  if (!settings) return track

  return {
    ...track,
    ...settings,
    presetId: settings.presetId ?? undefined,
    transition: settings.transition ?? undefined,
  }
}

export function updateAudioSceneTrackSettings(
  audio: WorldAudio,
  sceneId: string,
  trackId: string,
  changes: AudioSceneTrackChanges,
): WorldAudio {
  const track = getAudioSceneTrack(audio, sceneId, trackId)
  if (!track || !audio.scenes.some(scene => scene.id === sceneId && scene.trackIds.includes(trackId))) {
    throw new Error(`audio.sceneTrack.notFound:${sceneId}:${trackId}`)
  }

  const updatedTrack = { ...track, ...changes }
  const settings = toSceneTrackSettings(updatedTrack)
  return {
    ...audio,
    scenes: audio.scenes.map(scene => (
      scene.id === sceneId
        ? { ...scene, trackSettings: { ...scene.trackSettings, [trackId]: settings } }
        : scene
    )),
  }
}

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
      ...(scene.trackSettings
        ? {
            trackSettings: Object.fromEntries(
              Object.entries(scene.trackSettings).filter(([trackId]) => !removedTrackIds.has(trackId)),
            ),
          }
        : {}),
    })),
  }
}

export function removeAudioScene(audio: WorldAudio, sceneId: string): WorldAudio {
  return {
    ...audio,
    scenes: audio.scenes.filter(scene => scene.id !== sceneId),
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
