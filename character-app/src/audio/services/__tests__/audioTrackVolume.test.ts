import { describe, expect, it } from 'vitest'
import type { AudioTrack } from '@/world/types'
import {
  getAudioTrackVolume,
  setAudioTrackVolume,
  toggleAudioTrackMute,
} from '@/audio/services/audioTrackVolume'

const track: AudioTrack = {
  id: 'track-1',
  assetId: 'asset-1',
  name: 'Rain',
  loop: true,
  defaultVolume: 0.7,
}

describe('audioTrackVolume', () => {
  it('shows zero while muted and restores the previous volume when unmuted', () => {
    const mutedTrack = toggleAudioTrackMute(track)

    expect(getAudioTrackVolume(mutedTrack)).toBe(0)
    expect(mutedTrack.defaultVolume).toBe(0.7)

    const unmutedTrack = toggleAudioTrackMute(mutedTrack)

    expect(getAudioTrackVolume(unmutedTrack)).toBe(0.7)
  })

  it('mutes at zero without discarding the previous volume', () => {
    const mutedTrack = setAudioTrackVolume(track, 0)

    expect(mutedTrack.muted).toBe(true)
    expect(mutedTrack.defaultVolume).toBe(0.7)
    expect(getAudioTrackVolume(mutedTrack)).toBe(0)
    expect(getAudioTrackVolume(toggleAudioTrackMute(mutedTrack))).toBe(0.7)
  })

  it('treats the one-percent slider minimum as mute', () => {
    const mutedTrack = setAudioTrackVolume(track, 0.01)

    expect(mutedTrack.muted).toBe(true)
    expect(mutedTrack.defaultVolume).toBe(0.7)
    expect(getAudioTrackVolume(mutedTrack)).toBe(0)
    expect(getAudioTrackVolume(toggleAudioTrackMute(mutedTrack))).toBe(0.7)
  })

  it('sets a new volume and unmutes when the slider moves above zero', () => {
    const mutedTrack = toggleAudioTrackMute(track)
    const adjustedTrack = setAudioTrackVolume(mutedTrack, 0.4)

    expect(adjustedTrack.muted).toBe(false)
    expect(adjustedTrack.defaultVolume).toBe(0.4)
    expect(getAudioTrackVolume(adjustedTrack)).toBe(0.4)
  })
})
