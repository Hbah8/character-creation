import { describe, expect, it, vi } from 'vitest'
import { createSoundEffectPlaybackService } from '@/audio/services/soundEffectPlaybackService'

class FakeAudio extends EventTarget {
  loop = true
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())
}

describe('sound effect playback', () => {
  it('overlaps copies and stays active until the last copy ends', async () => {
    const instances: FakeAudio[] = []
    const revoke = vi.fn()
    const active = vi.fn()
    const service = createSoundEffectPlaybackService(
      () => {
        const audio = new FakeAudio()
        instances.push(audio)
        return audio
      },
      () => `blob:${instances.length}`,
      revoke,
      active,
      vi.fn(),
    )

    await service.play('button-1', {} as File)
    await service.play('button-1', {} as File)
    expect(instances).toHaveLength(2)
    expect(instances.every(instance => !instance.loop)).toBe(true)
    expect(active).toHaveBeenLastCalledWith('button-1', true)
    instances[0].dispatchEvent(new Event('ended'))
    expect(active).toHaveBeenLastCalledWith('button-1', true)
    instances[1].dispatchEvent(new Event('ended'))
    expect(active).toHaveBeenLastCalledWith('button-1', false)
    expect(revoke).toHaveBeenCalledTimes(2)
  })

  it('cleans up a rejected play and all pending sounds on disposal', async () => {
    const audio = new FakeAudio()
    audio.play.mockRejectedValueOnce(new Error('blocked'))
    const revoke = vi.fn()
    const active = vi.fn()
    const service = createSoundEffectPlaybackService(() => audio, () => 'blob:test', revoke, active, vi.fn())
    await expect(service.play('button-1', {} as File)).rejects.toThrow('blocked')
    expect(revoke).toHaveBeenCalledTimes(1)
    expect(active).toHaveBeenLastCalledWith('button-1', false)
    await service.play('button-1', {} as File)
    service.dispose()
    expect(audio.pause).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledTimes(2)
    expect(active).toHaveBeenLastCalledWith('button-1', false)
  })

  it('reports playback errors and releases only the failed instance', async () => {
    const instances: FakeAudio[] = []
    const revoke = vi.fn()
    const active = vi.fn()
    const onError = vi.fn()
    const service = createSoundEffectPlaybackService(() => {
      const audio = new FakeAudio()
      instances.push(audio)
      return audio
    }, () => 'blob:test', revoke, active, onError)
    await service.play('button-1', {} as File)
    await service.play('button-1', {} as File)
    instances[0].dispatchEvent(new Event('error'))
    expect(onError).toHaveBeenCalledOnce()
    expect(active).toHaveBeenLastCalledWith('button-1', true)
    expect(revoke).toHaveBeenCalledTimes(1)
    instances[1].dispatchEvent(new Event('ended'))
    expect(active).toHaveBeenLastCalledWith('button-1', false)
  })
})
