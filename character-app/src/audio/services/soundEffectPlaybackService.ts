interface SoundEffectAudio extends EventTarget {
  loop: boolean
  play(): Promise<void>
  pause(): void
}

export function createSoundEffectPlaybackService(
  createAudio: (source: string) => SoundEffectAudio,
  createObjectUrl: (file: File) => string,
  revokeObjectUrl: (source: string) => void,
  onActiveChange: (buttonId: string, active: boolean) => void,
  onPlaybackError: () => void,
) {
  const instances = new Map<SoundEffectAudio, { buttonId: string; source: string }>()
  let disposed = false

  function finish(audio: SoundEffectAudio): void {
    const instance = instances.get(audio)
    if (!instance) return
    instances.delete(audio)
    revokeObjectUrl(instance.source)
    if (![...instances.values()].some(item => item.buttonId === instance.buttonId)) {
      onActiveChange(instance.buttonId, false)
    }
  }

  return {
    async play(buttonId: string, file: File): Promise<void> {
      if (disposed) throw new Error('audio.playback.disposed')
      const source = createObjectUrl(file)
      let audio: SoundEffectAudio
      try {
        audio = createAudio(source)
      } catch (error) {
        revokeObjectUrl(source)
        throw error
      }
      instances.set(audio, { buttonId, source })
      audio.loop = false
      audio.addEventListener('ended', () => finish(audio), { once: true })
      audio.addEventListener('error', () => {
        if (!instances.has(audio)) return
        finish(audio)
        onPlaybackError()
      }, { once: true })
      onActiveChange(buttonId, true)
      try {
        await audio.play()
      } catch (error) {
        finish(audio)
        throw error
      }
    },
    dispose(): void {
      disposed = true
      for (const audio of instances.keys()) {
        audio.pause()
        finish(audio)
      }
    },
  }
}
