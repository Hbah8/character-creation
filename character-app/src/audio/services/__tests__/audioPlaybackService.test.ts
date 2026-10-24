import { describe, expect, it } from 'vitest'
import { createAudioPlaybackService } from '@/audio/services/audioPlaybackService'

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
