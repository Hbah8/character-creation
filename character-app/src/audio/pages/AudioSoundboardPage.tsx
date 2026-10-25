import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  addAudioAssets,
  getAudioSceneTrack,
  duckOtherAudioTracks,
  removeAudioScene,
  removeAudioAsset,
  updateAudioSceneTrackSettings,
} from '@/audio/services/audioLibraryService'
import { createAudioAssetMetadata } from '@/audio/services/audioAssetImportService'
import {
  getLocalAudioAssetBinding,
  deleteLocalAudioAssetBinding,
  saveLocalAudioAssetBinding,
} from '@/audio/services/localAudioAssetBindingRepository'
import {
  getAudioAssetAvailability,
  type AudioAssetAvailability,
} from '@/audio/services/audioAssetAvailabilityService'
import {
  AudioEmptyWorldState,
  AudioLibraryPanel,
  AudioMixerPanel,
  AudioScenesPanel,
  AudioWorldHeader,
} from '@/audio/components'
import { createEmptyWorldAudio } from '@/world/types'
import type { AudioAsset } from '@/world/types'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import {
  createAudioPlaybackService,
  getAudioPlaybackInstanceId,
  getTransitionDurationMs,
  type AudioPresetId,
} from '@/audio/services/audioPlaybackService'

const EMPTY_AUDIO_ASSETS: AudioAsset[] = []

function createSceneTrackSettings(track: NonNullable<ReturnType<typeof getAudioSceneTrack>>) {
  return {
    loop: track.loop,
    defaultVolume: track.defaultVolume,
    muted: track.muted ?? false,
    presetId: track.presetId ?? null,
    transition: track.transition ?? null,
  }
}

interface AudioFilePickerWindow extends Window {
  showOpenFilePicker?: (options: {
    multiple: boolean
    types: Array<{ description: string, accept: Record<string, string[]> }>
  }) => Promise<FileSystemFileHandle[]>
}

interface PermissionedFileSystemHandle extends FileSystemFileHandle {
  queryPermission(descriptor: { mode: 'read' }): Promise<PermissionState>
  requestPermission(descriptor: { mode: 'read' }): Promise<PermissionState>
}

type AudioErrorKey = 'unsupportedBrowser' | 'addFailed' | 'verifyFailed' | 'relinkFailed' | 'playbackFailed'

export function AudioSoundboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('audio')
  const { entries, activeWorldId, saveById, setActiveWorldId } = useWorldLibrary()
  const [errorKey, setErrorKey] = useState<AudioErrorKey | null>(null)
  const [availability, setAvailability] = useState<Record<string, AudioAssetAvailability>>({})
  const [activeTrackIds, setActiveTrackIds] = useState<string[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [playingTrackIds, setPlayingTrackIds] = useState<string[]>([])
  const [sceneName, setSceneName] = useState('')
  const [crossfadeTargetId, setCrossfadeTargetId] = useState('')
  const playbackRef = useRef(createAudioPlaybackService(source => new Audio(source), file => URL.createObjectURL(file), source => URL.revokeObjectURL(source)))
  const activeEntry = entries.find(entry => entry.id === activeWorldId)
  const assets = activeEntry?.world.audio?.assets ?? EMPTY_AUDIO_ASSETS
  const audio = activeEntry?.world.audio ?? createEmptyWorldAudio()

  function addTrack(asset: AudioAsset): void {
    const track = {
      id: crypto.randomUUID(),
      assetId: asset.id,
      name: asset.filename,
      loop: true,
      defaultVolume: 0.7,
      transition: 'fade-short' as const,
    }
    saveById(activeEntry!.id, { ...activeEntry!.world, audio: { ...audio, tracks: [...audio.tracks, track] } })
    setActiveTrackIds(ids => [...ids, track.id])
    setActiveSceneId(null)
  }

  async function getPlayableFile(trackId: string): Promise<File | undefined> {
    const track = audio.tracks.find(item => item.id === trackId)
    if (!track) return undefined
    const binding = await getLocalAudioAssetBinding(track.assetId)
    if (!binding) return undefined
    const fileHandle = binding.fileHandle as PermissionedFileSystemHandle
    const permission = await fileHandle.queryPermission({ mode: 'read' })
    if (permission !== 'granted' && await fileHandle.requestPermission({ mode: 'read' }) !== 'granted') return undefined
    return fileHandle.getFile()
  }

  async function playTrack(trackId: string, sceneId = activeSceneId): Promise<void> {
    try {
      const track = getAudioSceneTrack(audio, sceneId, trackId)
      if (!track) return
      const binding = await getLocalAudioAssetBinding(track.assetId)
      if (!binding) {
        setErrorKey('playbackFailed')
        return
      }

      const fileHandle = binding.fileHandle as PermissionedFileSystemHandle
      const permission = await fileHandle.queryPermission({ mode: 'read' })
      if (permission !== 'granted' && await fileHandle.requestPermission({ mode: 'read' }) !== 'granted') {
        setErrorKey('playbackFailed')
        return
      }
      const file = await binding.fileHandle.getFile()
      const playbackTrackId = getAudioPlaybackInstanceId(trackId, sceneId ?? undefined)
      await playbackRef.current.play(
        playbackTrackId,
        file,
        track.loop,
        track.muted ? 0 : track.defaultVolume,
        track.presetId as AudioPresetId | undefined,
      )
      playbackRef.current.fadeIn(
        playbackTrackId,
        track.muted ? 0 : track.defaultVolume,
        getTransitionDurationMs(track.transition),
      )
      setPlayingTrackIds(ids => ids.includes(trackId) ? ids : [...ids, trackId])
      setErrorKey(null)
    } catch {
      setErrorKey('playbackFailed')
    }
  }

  function pauseTrack(trackId: string): void {
    playbackRef.current.pause(getAudioPlaybackInstanceId(trackId, activeSceneId ?? undefined))
    setPlayingTrackIds(ids => ids.filter(id => id !== trackId))
  }

  function stopTrack(trackId: string): void {
    const track = getAudioSceneTrack(audio, activeSceneId, trackId)
    void playbackRef.current.stopWithTransition(
      getAudioPlaybackInstanceId(trackId, activeSceneId ?? undefined),
      getTransitionDurationMs(track?.transition),
    )
    setPlayingTrackIds(ids => ids.filter(id => id !== trackId))
  }

  function removeTrackFromMixer(trackId: string): void {
    stopTrack(trackId)
    setActiveTrackIds(ids => ids.filter(id => id !== trackId))
    setActiveSceneId(null)
  }

  function duckOtherTracks(foregroundTrackId: string): void {
    const updatedAudio = activeSceneId
      ? activeTrackIds.reduce((currentAudio, trackId) => {
          if (trackId === foregroundTrackId) return currentAudio
          const track = getAudioSceneTrack(currentAudio, activeSceneId, trackId)
          return track
            ? updateAudioSceneTrackSettings(currentAudio, activeSceneId, trackId, {
                defaultVolume: Number((track.defaultVolume * 0.3).toFixed(2)),
              })
            : currentAudio
        }, audio)
      : duckOtherAudioTracks(audio, foregroundTrackId)

    for (const trackId of activeTrackIds) {
      if (trackId !== foregroundTrackId) {
        const track = getAudioSceneTrack(updatedAudio, activeSceneId, trackId)
        if (track) {
          playbackRef.current.setVolume(
            getAudioPlaybackInstanceId(trackId, activeSceneId ?? undefined),
            track.muted ? 0 : track.defaultVolume,
          )
        }
      }
    }
    saveById(activeEntry!.id, { ...activeEntry!.world, audio: updatedAudio })
  }

  async function crossfadeToTarget(): Promise<void> {
    if (!crossfadeTargetId || activeTrackIds.length === 0) return
    try {
      const targetFile = await getPlayableFile(crossfadeTargetId)
      if (!targetFile) throw new Error('audio.asset.missing')
      const targetTrack = getAudioSceneTrack(audio, activeSceneId, crossfadeTargetId)
      if (!targetTrack) throw new Error('audio.track.missing')
      const outgoingTrackId = activeTrackIds.find(trackId => trackId !== crossfadeTargetId)
      if (!outgoingTrackId) return
      const outgoingPlaybackId = getAudioPlaybackInstanceId(outgoingTrackId, activeSceneId ?? undefined)
      const incomingPlaybackId = getAudioPlaybackInstanceId(crossfadeTargetId, activeSceneId ?? undefined)
      await playbackRef.current.crossfade(
        outgoingPlaybackId,
        incomingPlaybackId,
        targetFile,
        targetTrack.loop,
        targetTrack.muted ? 0 : targetTrack.defaultVolume,
        targetTrack.presetId as AudioPresetId | undefined,
        1200,
      )
      setPlayingTrackIds(ids => [...new Set([...ids.filter(id => id !== outgoingTrackId), crossfadeTargetId])])
    } catch {
      setErrorKey('playbackFailed')
    }
  }

  function updateTrack(trackId: string, changes: Partial<typeof audio.tracks[number]>): void {
    const track = getAudioSceneTrack(audio, activeSceneId, trackId)
    if (track) {
      const updatedTrack = { ...track, ...changes }
      const playbackTrackId = getAudioPlaybackInstanceId(trackId, activeSceneId ?? undefined)
      playbackRef.current.setVolume(
        playbackTrackId,
        updatedTrack.muted ? 0 : updatedTrack.defaultVolume,
      )
      if ('loop' in changes) playbackRef.current.setLoop(playbackTrackId, updatedTrack.loop)
      if ('presetId' in changes) {
        playbackRef.current.setPreset(playbackTrackId, updatedTrack.presetId)
      }
    }

    const updatedAudio = activeSceneId
      ? updateAudioSceneTrackSettings(audio, activeSceneId, trackId, changes)
      : {
          ...audio,
          tracks: audio.tracks.map(track => track.id === trackId ? { ...track, ...changes } : track),
        }
    saveById(activeEntry!.id, { ...activeEntry!.world, audio: updatedAudio })
  }

  function saveScene(): void {
    const name = sceneName.trim()
    if (!name || activeTrackIds.length === 0) return
    saveById(activeEntry!.id, {
      ...activeEntry!.world,
      audio: {
        ...audio,
        scenes: [
          ...audio.scenes,
          {
            id: crypto.randomUUID(),
            name,
            trackIds: [...activeTrackIds],
            trackSettings: Object.fromEntries(activeTrackIds.flatMap(trackId => {
              const track = getAudioSceneTrack(audio, activeSceneId, trackId)
              return track ? [[trackId, createSceneTrackSettings(track)]] : []
            })),
          },
        ],
      },
    })
    setSceneName('')
  }

  function deleteScene(sceneId: string): void {
    if (!activeEntry) return
    if (activeSceneId === sceneId) setActiveSceneId(null)
    saveById(activeEntry.id, {
      ...activeEntry.world,
      audio: removeAudioScene(activeEntry.world.audio ?? createEmptyWorldAudio(), sceneId),
    })
  }

  async function activateScene(sceneId: string): Promise<void> {
    const scene = audio.scenes.find(item => item.id === sceneId)
    if (!scene) return
    for (const trackId of activeTrackIds) {
      playbackRef.current.pause(getAudioPlaybackInstanceId(trackId, activeSceneId ?? undefined))
    }
    setPlayingTrackIds([])
    setActiveSceneId(scene.id)
    setActiveTrackIds(scene.trackIds)
    await Promise.all(scene.trackIds.map(trackId => playTrack(trackId, scene.id)))
  }

  async function relinkAsset(asset: AudioAsset): Promise<void> {
    const picker = window as AudioFilePickerWindow
    if (!picker.showOpenFilePicker) {
      setErrorKey('unsupportedBrowser')
      return
    }
    try {
      const [fileHandle] = await picker.showOpenFilePicker({ multiple: false, types: [{ description: 'Audio files', accept: { 'audio/*': ['.mp3', '.wav', '.mp4'] } }] })
      if (!fileHandle || !activeEntry) return
      const replacement = createAudioAssetMetadata(await fileHandle.getFile(), asset.id)
      await saveLocalAudioAssetBinding({ assetId: asset.id, fileHandle, lastVerifiedAt: new Date().toISOString() })
      saveById(activeEntry.id, { ...activeEntry.world, audio: { ...(activeEntry.world.audio ?? createEmptyWorldAudio()), assets: assets.map(existing => existing.id === asset.id ? replacement : existing) } })
      setErrorKey(null)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setErrorKey('relinkFailed')
    }
  }

  async function removeAsset(assetId: string): Promise<void> {
    if (!activeEntry) return
    await deleteLocalAudioAssetBinding(assetId)
    saveById(activeEntry.id, { ...activeEntry.world, audio: removeAudioAsset(activeEntry.world.audio ?? createEmptyWorldAudio(), assetId) })
  }

  useEffect(() => {
    let cancelled = false
    void getAudioAssetAvailability(assets, getLocalAudioAssetBinding)
      .then(statuses => {
        if (!cancelled) setAvailability(statuses)
      })
      .catch(() => {
        if (!cancelled) setErrorKey('verifyFailed')
      })
    return () => {
      cancelled = true
    }
  }, [assets])

  async function addFiles(): Promise<void> {
    const picker = window as AudioFilePickerWindow
    if (!picker.showOpenFilePicker) {
      setErrorKey('unsupportedBrowser')
      return
    }

    try {
      const handles = await picker.showOpenFilePicker({
        multiple: true,
        types: [{
          description: 'Audio files',
          accept: { 'audio/*': ['.mp3', '.wav', '.mp4'] },
        }],
      })
      const assetsToAdd = await Promise.all(handles.map(async fileHandle => {
        const file = await fileHandle.getFile()
        const asset = createAudioAssetMetadata(file, crypto.randomUUID())
        await saveLocalAudioAssetBinding({
          assetId: asset.id,
          fileHandle,
          lastVerifiedAt: new Date().toISOString(),
        })
        return asset
      }))
      if (!activeEntry) return
      const updatedWorld = {
        ...activeEntry.world,
        audio: addAudioAssets(activeEntry.world.audio ?? createEmptyWorldAudio(), assetsToAdd),
      }
      saveById(activeEntry.id, updatedWorld)
      setErrorKey(null)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setErrorKey('addFailed')
    }
  }

  if (!activeEntry) {
    return (
      <AudioEmptyWorldState
        worlds={entries.map(entry => ({ id: entry.id, name: entry.world.name }))}
        onSelectWorld={setActiveWorldId}
        onCreateWorld={() => navigate('/worlds/new')}
        onOpenWorlds={() => navigate('/worlds')}
      />
    )
  }

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5 p-6 max-md:gap-4 max-md:px-3.5 max-md:py-4">
        <AudioWorldHeader
          activeWorldId={activeEntry.id}
          activeWorldName={activeEntry.world.name}
          worlds={entries.map(entry => ({ id: entry.id, name: entry.world.name }))}
          onSelectWorld={setActiveWorldId}
        />

        {errorKey && (
          <Alert variant="destructive">
            <AlertTitle>{t('title')}</AlertTitle>
            <AlertDescription>{t(errorKey)}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-[minmax(235px,0.92fr)_minmax(340px,1.34fr)_minmax(225px,0.82fr)] items-start gap-3 max-[1180px]:grid-cols-2 max-md:grid-cols-1">
          <AudioLibraryPanel
            assets={assets}
            availability={availability}
            onAddFiles={() => void addFiles()}
            onAddToMixer={addTrack}
            onRelink={asset => void relinkAsset(asset)}
            onRemove={assetId => void removeAsset(assetId)}
          />

          <AudioMixerPanel
            tracks={activeTrackIds.flatMap(trackId => {
              const track = getAudioSceneTrack(audio, activeSceneId, trackId)
              return track ? [track] : []
            })}
            playingTrackIds={playingTrackIds}
            crossfadeTargetId={crossfadeTargetId}
            onTrackChange={updateTrack}
            onPlayPause={trackId => {
              if (playingTrackIds.includes(trackId)) pauseTrack(trackId)
              else void playTrack(trackId)
            }}
            onRemove={removeTrackFromMixer}
            onStop={stopTrack}
            onDuck={duckOtherTracks}
            onCrossfadeTargetChange={setCrossfadeTargetId}
            onCrossfade={() => void crossfadeToTarget()}
          />

          <AudioScenesPanel
            scenes={audio.scenes}
            activeSceneId={activeSceneId}
            activeTrackIds={activeTrackIds}
            sceneName={sceneName}
            onSceneNameChange={setSceneName}
            onSaveScene={saveScene}
            onActivateScene={sceneId => void activateScene(sceneId)}
            onRemoveScene={deleteScene}
          />
        </div>
      </div>
    </div>
  )
}
