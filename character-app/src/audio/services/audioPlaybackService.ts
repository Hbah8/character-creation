interface AudioElement {
  currentTime: number
  loop: boolean
  paused: boolean
  volume: number
  pause(): void
  play(): Promise<void>
}

export type AudioTransition = 'instant' | 'fade-short' | 'fade-medium' | 'fade-long'

export function getTransitionDurationMs(transition: AudioTransition | undefined): number {
  switch (transition) {
    case 'fade-short':
      return 1000
    case 'fade-medium':
      return 3000
    case 'fade-long':
      return 5000
    default:
      return 0
  }
}

export const AUDIO_PRESET_IDS = [
  'underwater',
  'tunnel',
  'distortion',
  'behind-door',
  'cave',
  'radio',
  'distant',
  'haunted',
  'explosion-aftermath',
  'dreamlike',
] as const

export type AudioPresetId = typeof AUDIO_PRESET_IDS[number]

interface BrowserTrack {
  audio: AudioElement
  source: string
  input?: MediaElementAudioSourceNode
  gain?: GainNode
  effectNodes: AudioNode[]
}

export function createAudioPlaybackService(
  createAudio: (source: string) => AudioElement,
  createObjectUrl: (file: File) => string,
  revokeObjectUrl: (source: string) => void,
) {
  const tracks = new Map<string, BrowserTrack>()
  let context: AudioContext | undefined

  function clearEffectNodes(track: BrowserTrack): void {
    track.input?.disconnect()
    for (const node of track.effectNodes) node.disconnect()
    track.effectNodes = []
  }

  function createFeedbackDelay(
    input: AudioNode,
    output: AudioNode,
    delaySeconds: number,
    feedbackAmount: number,
    wetAmount: number,
    nodes: AudioNode[],
  ): void {
    if (!context) return
    const delay = context.createDelay(3)
    const feedback = context.createGain()
    const wet = context.createGain()
    delay.delayTime.value = delaySeconds
    feedback.gain.value = feedbackAmount
    wet.gain.value = wetAmount
    input.connect(delay)
    delay.connect(feedback).connect(delay)
    delay.connect(wet).connect(output)
    nodes.push(delay, feedback, wet)
  }

  function connectPreset(track: BrowserTrack, presetId?: AudioPresetId): void {
    if (!context || !track.input || !track.gain) return
    clearEffectNodes(track)
    const nodes: AudioNode[] = []
    const connectToGain = (node: AudioNode, gain = 1): GainNode => {
      const level = context!.createGain()
      level.gain.value = gain
      node.connect(level).connect(track.gain!)
      nodes.push(level)
      return level
    }

    if (presetId === 'underwater') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 700
      filter.Q.value = 0.7
      track.input.connect(filter)
      connectToGain(filter, 0.8)
      nodes.push(filter)
    } else if (presetId === 'tunnel') {
      createFeedbackDelay(track.input, track.gain, 0.28, 0.38, 0.6, nodes)
      connectToGain(track.input, 0.65)
    } else if (presetId === 'distortion') {
      const distortion = context.createWaveShaper()
      const curve = new Float32Array(44100)
      for (let index = 0; index < curve.length; index += 1) curve[index] = Math.tanh((index / 22050 - 1) * 12)
      distortion.curve = curve
      const filter = context.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1400
      filter.Q.value = 1.2
      track.input.connect(distortion).connect(filter)
      connectToGain(filter, 0.85)
      nodes.push(distortion, filter)
    } else if (presetId === 'behind-door') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 480
      track.input.connect(filter)
      connectToGain(filter, 0.38)
      nodes.push(filter)
    } else if (presetId === 'cave') {
      createFeedbackDelay(track.input, track.gain, 0.46, 0.55, 0.75, nodes)
      createFeedbackDelay(track.input, track.gain, 0.83, 0.3, 0.35, nodes)
      connectToGain(track.input, 0.45)
    } else if (presetId === 'radio') {
      const filter = context.createBiquadFilter()
      const compressor = context.createDynamicsCompressor()
      filter.type = 'bandpass'
      filter.frequency.value = 1650
      filter.Q.value = 0.9
      compressor.threshold.value = -28
      compressor.ratio.value = 8
      track.input.connect(filter).connect(compressor)
      connectToGain(compressor, 0.92)
      nodes.push(filter, compressor)
    } else if (presetId === 'distant') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1300
      track.input.connect(filter)
      connectToGain(filter, 0.32)
      createFeedbackDelay(filter, track.gain, 0.23, 0.25, 0.32, nodes)
      nodes.push(filter)
    } else if (presetId === 'haunted') {
      const delay = context.createDelay(3)
      const lfo = context.createOscillator()
      const lfoGain = context.createGain()
      delay.delayTime.value = 0.62
      lfo.frequency.value = 0.22
      lfoGain.gain.value = 0.08
      lfo.connect(lfoGain).connect(delay.delayTime)
      lfo.start()
      track.input.connect(delay)
      connectToGain(delay, 0.8)
      createFeedbackDelay(delay, track.gain, 1.1, 0.42, 0.35, nodes)
      nodes.push(delay, lfo, lfoGain)
    } else if (presetId === 'explosion-aftermath') {
      const filter = context.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 550
      track.input.connect(filter)
      connectToGain(filter, 0.72)
      nodes.push(filter)
    } else if (presetId === 'dreamlike') {
      const delay = context.createDelay(3)
      const lfo = context.createOscillator()
      const lfoGain = context.createGain()
      delay.delayTime.value = 0.72
      lfo.frequency.value = 0.12
      lfoGain.gain.value = 0.06
      lfo.connect(lfoGain).connect(delay.delayTime)
      lfo.start()
      track.input.connect(delay)
      connectToGain(track.input, 0.62)
      connectToGain(delay, 0.6)
      createFeedbackDelay(delay, track.gain, 1.35, 0.28, 0.3, nodes)
      nodes.push(delay, lfo, lfoGain)
    } else {
      track.input.connect(track.gain)
    }
  }

  return {
    async play(trackId: string, file: File, loop: boolean, volume: number, presetId?: AudioPresetId): Promise<void> {
      let track = tracks.get(trackId)
      if (!track) {
        const source = createObjectUrl(file)
        track = { audio: createAudio(source), source, effectNodes: [] }
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
      if (track) connectPreset(track, presetId as AudioPresetId | undefined)
    },
    fadeTo(trackId: string, volume: number, durationMs: number): void {
      const track = tracks.get(trackId)
      if (!track) return
      const target = Math.min(1, Math.max(0, volume))
      if (context && track.gain) {
        const now = context.currentTime
        track.gain.gain.cancelScheduledValues(now)
        track.gain.gain.setValueAtTime(track.gain.gain.value, now)
        track.gain.gain.linearRampToValueAtTime(target, now + durationMs / 1000)
      } else {
        track.audio.volume = target
      }
    },
    fadeIn(trackId: string, volume: number, durationMs: number): void {
      const track = tracks.get(trackId)
      if (!track || durationMs === 0) {
        this.fadeTo(trackId, volume, 0)
        return
      }
      if (context && track.gain) {
        const now = context.currentTime
        track.gain.gain.cancelScheduledValues(now)
        track.gain.gain.setValueAtTime(0, now)
        track.gain.gain.linearRampToValueAtTime(volume, now + durationMs / 1000)
      } else {
        track.audio.volume = volume
      }
    },
    async stopWithTransition(trackId: string, durationMs: number): Promise<void> {
      const track = tracks.get(trackId)
      if (!track) return
      if (durationMs === 0) {
        this.stop(trackId)
        return
      }
      this.fadeTo(trackId, 0, durationMs)
      await new Promise<void>(resolve => window.setTimeout(resolve, durationMs))
      this.stop(trackId)
    },
    async crossfade(
      outgoingTrackId: string,
      incomingTrackId: string,
      incomingFile: File,
      incomingLoop: boolean,
      incomingVolume: number,
      incomingPresetId: AudioPresetId | undefined,
      durationMs: number,
    ): Promise<void> {
      await this.play(incomingTrackId, incomingFile, incomingLoop, 0, incomingPresetId)
      this.fadeTo(outgoingTrackId, 0, durationMs)
      this.fadeTo(incomingTrackId, incomingVolume, durationMs)
    },
    duck(exceptTrackId: string, durationMs: number): void {
      for (const [trackId, track] of tracks) {
        if (trackId === exceptTrackId) continue
        const originalVolume = track.audio.volume
        this.fadeTo(trackId, originalVolume * 0.3, 120)
        window.setTimeout(() => this.fadeTo(trackId, originalVolume, 220), durationMs)
      }
    },
    dispose(): void {
      for (const track of tracks.values()) {
        track.audio.pause()
        clearEffectNodes(track)
        revokeObjectUrl(track.source)
      }
      tracks.clear()
    },
  }
}
