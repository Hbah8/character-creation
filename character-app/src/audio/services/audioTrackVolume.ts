import type { AudioTrack } from '@/world/types'

export function isAudioTrackMuted(track: AudioTrack): boolean {
  return track.muted ?? false
}

export function getAudioTrackVolume(track: AudioTrack): number {
  return isAudioTrackMuted(track) ? 0 : track.defaultVolume
}

export function setAudioTrackVolume(track: AudioTrack, volume: number): AudioTrack {
  const normalizedVolume = Math.min(1, Math.max(0, volume))

  if (normalizedVolume <= 0.01) {
    return { ...track, muted: true }
  }

  return { ...track, defaultVolume: normalizedVolume, muted: false }
}

export function toggleAudioTrackMute(track: AudioTrack): AudioTrack {
  return { ...track, muted: !isAudioTrackMuted(track) }
}
