import { AudioLines, Pause, Play, Repeat2, Square, Volume2, VolumeX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import type { AudioPresetId } from '@/audio/services/audioPlaybackService'
import {
  getAudioTrackVolume,
  isAudioTrackMuted,
  setAudioTrackVolume,
  toggleAudioTrackMute,
} from '@/audio/services/audioTrackVolume'
import type { AudioTrack } from '@/world/types'

const EFFECT_OPTIONS = [
  { id: 'clean', label: 'presetClean' },
  { id: 'underwater', label: 'presetUnderwater' },
  { id: 'tunnel', label: 'presetTunnel' },
  { id: 'distortion', label: 'presetDistortion' },
  { id: 'behind-door', label: 'presetBehindDoor' },
  { id: 'cave', label: 'presetCave' },
  { id: 'radio', label: 'presetRadio' },
  { id: 'distant', label: 'presetDistant' },
  { id: 'haunted', label: 'presetHaunted' },
  { id: 'explosion-aftermath', label: 'presetExplosionAftermath' },
  { id: 'dreamlike', label: 'presetDreamlike' },
] as const

export interface AudioTrackActions {
  onPlayPause: (trackId: string) => void
  onTrackChange: (
    trackId: string,
    changes: Partial<Pick<AudioTrack, 'loop' | 'muted' | 'defaultVolume' | 'transition' | 'presetId'>>,
  ) => void
  onRemove: (trackId: string) => void
  onStop: (trackId: string) => void
  onDuck: (trackId: string) => void
}

interface AudioTrackCardProps extends AudioTrackActions {
  track: AudioTrack
  isPlaying: boolean
}

export function AudioTrackCard({
  track,
  isPlaying,
  onPlayPause,
  onTrackChange,
  onRemove,
  onStop,
  onDuck,
}: AudioTrackCardProps) {
  const { t } = useTranslation('audio')
  const isMuted = isAudioTrackMuted(track)
  const volume = getAudioTrackVolume(track)

  return (
    <article
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted p-2.5 data-[playing=true]:border-primary"
      data-playing={isPlaying}
    >
      <div className="flex items-center gap-1.5">
        <Button
          size="icon"
          className="shrink-0"
          aria-label={isPlaying ? t('pauseTrack') : t('playTrack')}
          onClick={() => onPlayPause(track.id)}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pl-0.5">
          <strong className="truncate text-[11px] font-semibold">{track.name}</strong>
          <span className="text-[9px] text-muted-foreground">
            {isPlaying ? t('playing') : t('paused')} · {track.loop ? t('looping') : t('once')}
          </span>
        </div>
        <Toggle
          variant="outline"
          size="sm"
          pressed={track.loop}
          aria-label={t('toggleLoop')}
          onPressedChange={loop => onTrackChange(track.id, { loop })}
        >
          <Repeat2 />
        </Toggle>
        <Button
          size="icon"
          variant="outline"
          aria-label={isMuted ? t('unmuteTrack') : t('muteTrack')}
          onClick={() => onTrackChange(track.id, { muted: toggleAudioTrackMute(track).muted })}
        >
          {isMuted ? <VolumeX /> : <Volume2 />}
        </Button>
        <Button size="icon" variant="outline" aria-label={t('removeFromMixer')} onClick={() => onRemove(track.id)}>
          <X />
        </Button>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
        <label className="text-[9px] uppercase tracking-wide text-muted-foreground" htmlFor={`audio-volume-${track.id}`}>
          {t('volume')}
        </label>
        <span className="text-[9px] text-muted-foreground">{Math.round(volume * 100)}%</span>
        <input
          id={`audio-volume-${track.id}`}
          className="col-span-2 h-3 w-full cursor-pointer accent-primary"
          type="range"
          aria-label={t('volume')}
          value={Math.round(volume * 100)}
          min={0}
          max={100}
          step={1}
          onChange={event => {
            const updatedTrack = setAudioTrackVolume(track, Number(event.currentTarget.value) / 100)
            onTrackChange(track.id, {
              defaultVolume: updatedTrack.defaultVolume,
              muted: updatedTrack.muted,
            })
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('transitionLabel')}</span>
          <Select
            value={track.transition ?? 'instant'}
            onValueChange={transition => onTrackChange(track.id, { transition: transition as AudioTrack['transition'] })}
          >
            <SelectTrigger className="h-[30px] w-full min-w-0 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="instant">{t('transitionInstant')}</SelectItem>
                <SelectItem value="fade-short">{t('transitionShort')}</SelectItem>
                <SelectItem value="fade-medium">{t('transitionMedium')}</SelectItem>
                <SelectItem value="fade-long">{t('transitionLong')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('effectLabel')}</span>
          <Select
            value={track.presetId ?? 'clean'}
            onValueChange={presetId => onTrackChange(
              track.id,
              { presetId: presetId === 'clean' ? undefined : presetId as AudioPresetId },
            )}
          >
            <SelectTrigger className="h-[30px] w-full min-w-0 text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {EFFECT_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>{t(option.label)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" className="text-[10px]" onClick={() => onStop(track.id)}>
          <Square data-icon="inline-start" />
          {t('stopTrack')}
        </Button>
        <Button size="sm" variant="outline" className="text-[10px]" onClick={() => onDuck(track.id)}>
          {t('duckOthers')}
        </Button>
      </div>
    </article>
  )
}

interface AudioMixerPanelProps extends AudioTrackActions {
  tracks: AudioTrack[]
  playingTrackIds: string[]
  crossfadeTargetId: string
  onCrossfadeTargetChange: (trackId: string) => void
  onCrossfade: () => void
}

export function AudioMixerPanel({
  tracks,
  playingTrackIds,
  crossfadeTargetId,
  onCrossfadeTargetChange,
  onCrossfade,
  ...trackActions
}: AudioMixerPanelProps) {
  const { t } = useTranslation('audio')

  return (
    <Card className="gap-3.5 rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="flex items-start justify-between gap-2 px-3.5">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AudioLines className="size-4 text-primary" />
            {t('mixerTitle')}
          </CardTitle>
          <CardDescription>{t('mixerTrackCount', { count: tracks.length })}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 px-3.5">
        {tracks.length === 0 ? (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">{t('emptyMixer')}</p>
        ) : (
          tracks.map(track => (
            <AudioTrackCard
              key={track.id}
              track={track}
              isPlaying={playingTrackIds.includes(track.id)}
              {...trackActions}
            />
          ))
        )}
      </CardContent>
      {tracks.length > 1 && (
        <CardContent className="mx-3.5 mb-3.5 flex flex-col gap-2 rounded-lg border border-border bg-muted p-3">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{t('crossfade')}</span>
          <div className="flex items-center gap-2">
            <Select value={crossfadeTargetId} onValueChange={onCrossfadeTargetChange}>
              <SelectTrigger className="h-[30px] min-w-0 flex-1 text-[10px]">
                <SelectValue placeholder={t('crossfadeTarget')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tracks.map(track => (
                    <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={!crossfadeTargetId} onClick={onCrossfade}>
              {t('startCrossfade')}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
