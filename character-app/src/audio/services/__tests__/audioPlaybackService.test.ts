import { describe, expect, it } from 'vitest'
import {
  createAudioPlaybackService,
  getAudioPlaybackInstanceId,
  getTransitionDurationMs,
} from '@/audio/services/audioPlaybackService'

describe('audioPlaybackService', () => {
  it('plays independent tracks simultaneously and controls each one separately', async () => {
    const created: FakeAudio[] = []
    const service = createAudioPlaybackService(
      source => {
        const audio = new FakeAudio(source)
        created.push(audio)
        return audio
      },
      () => 'blob:test',
      () => undefined,
    )

    await service.play('track-1', {} as File, true, 0.5)
    await service.play('track-2', {} as File, false, 1)
    service.pause('track-1')
    service.stop('track-2')

    expect(created).toHaveLength(2)
    expect(created[0].paused).toBe(true)
    expect(created[0].loop).toBe(true)
    expect(created[0].volume).toBe(0.5)
    expect(created[1].paused).toBe(true)
    expect(created[1].currentTime).toBe(0)
  })

  it('applies an immediate volume change at both valid boundaries', async () => {
    const created: FakeAudio[] = []
    const service = createAudioPlaybackService(
      source => {
        const audio = new FakeAudio(source)
        created.push(audio)
        return audio
      },
      () => 'blob:test',
      () => undefined,
    )

    await service.play('track-1', {} as File, false, 0.5)
    service.setVolume('track-1', 0)
    expect(created[0].volume).toBe(0)

    service.setVolume('track-1', 1)
    expect(created[0].volume).toBe(1)
  })

  it('keeps the same track independent between scene playback instances', async () => {
    const created: FakeAudio[] = []
    const service = createAudioPlaybackService(
      source => {
        const audio = new FakeAudio(source)
        created.push(audio)
        return audio
      },
      () => 'blob:test',
      () => undefined,
    )

    const sceneATrackId = getAudioPlaybackInstanceId('track-1', 'scene-a')
    const sceneBTrackId = getAudioPlaybackInstanceId('track-1', 'scene-b')
    await service.play(sceneATrackId, {} as File, true, 0.3)
    await service.play(sceneBTrackId, {} as File, true, 0.8)
    created[0].currentTime = 35
    service.setLoop(sceneATrackId, false)
    service.pause(sceneATrackId)

    expect(sceneATrackId).not.toBe(sceneBTrackId)
    expect(created).toHaveLength(2)
    expect(created[0]).toMatchObject({ paused: true, currentTime: 35, loop: false, volume: 0.3 })
    expect(created[1]).toMatchObject({ paused: false, currentTime: 0, loop: true, volume: 0.8 })
  })

  it('maps transition options to their fade duration', () => {
    expect(getTransitionDurationMs('instant')).toBe(0)
    expect(getTransitionDurationMs('fade-short')).toBe(1000)
    expect(getTransitionDurationMs('fade-medium')).toBe(3000)
    expect(getTransitionDurationMs('fade-long')).toBe(5000)
  })
})

class FakeAudio {
  currentTime = 0
  loop = false
  paused = true
  volume = 1

  constructor(readonly src: string) {}

  play(): Promise<void> {
    this.paused = false
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }
}
