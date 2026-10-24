interface AudioElement {
  currentTime: number
  loop: boolean
  paused: boolean
  volume: number
  pause(): void
  play(): Promise<void>
}

export function createAudioPlaybackService(
  createAudio: (source: string) => AudioElement,
  createObjectUrl: (file: File) => string,
  revokeObjectUrl: (source: string) => void,
) {
  const tracks = new Map<string, { audio: AudioElement, source: string, input?: MediaElementAudioSourceNode, gain?: GainNode }>()
  let context: AudioContext | undefined

  function connectPreset(track: { input?: MediaElementAudioSourceNode, gain?: GainNode }, presetId?: string): void {
    if (!context || !track.input || !track.gain) return
    track.input.disconnect()
    if (presetId === 'underwater') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 700
      track.input.connect(filter).connect(track.gain)
    } else if (presetId === 'tunnel') {
      const delay = context.createDelay(2)
      const feedback = context.createGain()
      delay.delayTime.value = 0.28
      feedback.gain.value = 0.38
      track.input.connect(delay).connect(track.gain)
      delay.connect(feedback).connect(delay)
    } else if (presetId === 'distortion') {
      const distortion = context.createWaveShaper()
      const curve = new Float32Array(44100)
      for (let index = 0; index < curve.length; index += 1) curve[index] = Math.tanh((index / 22050 - 1) * 12)
      distortion.curve = curve
      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1400
      track.input.connect(distortion).connect(filter).connect(track.gain)
    } else {
      track.input.connect(track.gain)
    }
  }

  return {
    async play(trackId: string, file: File, loop: boolean, volume: number, presetId?: string): Promise<void> {
      let track = tracks.get(trackId)
      if (!track) {
        const source = createObjectUrl(file)
        track = { audio: createAudio(source), source }
        if (typeof AudioContext !== 'undefined' && track.audio instanceof HTMLAudioElement) {
          context ??= new AudioContext()
          track.input = context.createMediaElementSource(track.audio)
          track.gain = context.createGain()
          track.gain.connect(context.destination)
        }
        tracks.set(trackId, track)
      }
      if (context?.state === 'suspended') await context.resume()
      connectPreset(track, presetId)
      track.audio.loop = loop
      track.audio.volume = volume
      await track.audio.play()
    },
    pause(trackId: string): void {
      tracks.get(trackId)?.audio.pause()
    },
    stop(trackId: string): void {
      const track = tracks.get(trackId)
      if (!track) return
      track.audio.pause()
      track.audio.currentTime = 0
    },
    setVolume(trackId: string, volume: number): void {
      const track = tracks.get(trackId)
      if (!track) return
      track.audio.volume = Math.min(1, Math.max(0, volume))
    },
    setPreset(trackId: string, presetId?: string): void {
      const track = tracks.get(trackId)
      if (track) connectPreset(track, presetId)
    },
    dispose(): void {
      for (const track of tracks.values()) {
        track.audio.pause()
        revokeObjectUrl(track.source)
      }
      tracks.clear()
    },
  }
}
