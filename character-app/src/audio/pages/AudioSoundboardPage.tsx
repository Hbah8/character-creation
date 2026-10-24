import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileAudio, Link2, Music2, Pause, Play, Square, Trash2, Upload, Volume2, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { addAudioAssets, removeAudioAsset } from '@/audio/services/audioLibraryService'
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
import { createEmptyWorldAudio } from '@/world/types'
import type { AudioAsset } from '@/world/types'
import { useWorldLibrary } from '@/world/store/useWorldLibrary'
import { createAudioPlaybackService } from '@/audio/services/audioPlaybackService'

const EMPTY_AUDIO_ASSETS: AudioAsset[] = []

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
  const { t } = useTranslation('audio')
  const { entries, activeWorldId, saveById } = useWorldLibrary()
  const [errorKey, setErrorKey] = useState<AudioErrorKey | null>(null)
  const [availability, setAvailability] = useState<Record<string, AudioAssetAvailability>>({})
  const [activeTrackIds, setActiveTrackIds] = useState<string[]>([])
  const [playingTrackIds, setPlayingTrackIds] = useState<string[]>([])
  const [sceneName, setSceneName] = useState('')
  const playbackRef = useRef(createAudioPlaybackService(source => new Audio(source), file => URL.createObjectURL(file), source => URL.revokeObjectURL(source)))
  const activeEntry = entries.find(entry => entry.id === activeWorldId)
  const assets = activeEntry?.world.audio?.assets ?? EMPTY_AUDIO_ASSETS
  const audio = activeEntry?.world.audio ?? createEmptyWorldAudio()

  function addTrack(asset: AudioAsset): void {
    const track = { id: crypto.randomUUID(), assetId: asset.id, name: asset.filename, loop: true, defaultVolume: 0.7 }
    saveById(activeEntry!.id, { ...activeEntry!.world, audio: { ...audio, tracks: [...audio.tracks, track] } })
    setActiveTrackIds(ids => [...ids, track.id])
  }

  async function playTrack(trackId: string): Promise<void> {
    try {
      const track = audio.tracks.find(item => item.id === trackId)
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
      await playbackRef.current.play(trackId, file, track.loop, track.muted ? 0 : track.defaultVolume, track.presetId)
      setPlayingTrackIds(ids => ids.includes(trackId) ? ids : [...ids, trackId])
      setErrorKey(null)
    } catch {
      setErrorKey('playbackFailed')
    }
  }

  function pauseTrack(trackId: string): void {
    playbackRef.current.pause(trackId)
    setPlayingTrackIds(ids => ids.filter(id => id !== trackId))
  }

  function stopTrack(trackId: string): void {
    playbackRef.current.stop(trackId)
    setPlayingTrackIds(ids => ids.filter(id => id !== trackId))
  }

  function removeTrackFromMixer(trackId: string): void {
    stopTrack(trackId)
    setActiveTrackIds(ids => ids.filter(id => id !== trackId))
  }

  function updateTrack(trackId: string, changes: Partial<typeof audio.tracks[number]>): void {
    const track = audio.tracks.find(item => item.id === trackId)
    if (track) {
      const updatedTrack = { ...track, ...changes }
      playbackRef.current.setVolume(
        trackId,
        updatedTrack.muted ? 0 : updatedTrack.defaultVolume,
      )
      if (changes.presetId !== undefined || ('presetId' in changes && changes.presetId === undefined)) {
        playbackRef.current.setPreset(trackId, updatedTrack.presetId)
      }
    }

    saveById(activeEntry!.id, { ...activeEntry!.world, audio: { ...audio, tracks: audio.tracks.map(track => track.id === trackId ? { ...track, ...changes } : track) } })
  }

  function saveScene(): void {
    const name = sceneName.trim()
    if (!name || activeTrackIds.length === 0) return
    saveById(activeEntry!.id, {
      ...activeEntry!.world,
      audio: { ...audio, scenes: [...audio.scenes, { id: crypto.randomUUID(), name, trackIds: activeTrackIds }] },
    })
    setSceneName('')
  }

  async function activateScene(sceneId: string): Promise<void> {
    const scene = audio.scenes.find(item => item.id === sceneId)
    if (!scene) return
    setActiveTrackIds(scene.trackIds)
    await Promise.all(scene.trackIds.map(playTrack))
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
      <div className="h-full w-full min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('noWorldTitle')}</CardTitle>
              <CardDescription>{t('noWorldDescription')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full min-h-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Button onClick={() => void addFiles()}>
            <Upload data-icon="inline-start" />
            {t('addFiles')}
          </Button>
        </div>

        {errorKey && (
          <Alert variant="destructive">
            <AlertTitle>{t('title')}</AlertTitle>
            <AlertDescription>{t(errorKey)}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('libraryTitle')}</CardTitle>
            <CardDescription>{t('fileCount', { count: assets.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('emptyLibrary')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {assets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileAudio className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{asset.filename}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">{asset.mediaType}</Badge>
                      <Badge variant={availability[asset.id] === 'available' ? 'default' : 'outline'}>
                        {t(availability[asset.id] ?? 'missing')}
                      </Badge>
                      <Button size="sm" disabled={availability[asset.id] !== 'available'} onClick={() => addTrack(asset)}>
                        <Play data-icon="inline-start" />
                        {t('addToMixer')}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => void relinkAsset(asset)}
                        aria-label={t('relinkAsset')}
                      >
                        <Link2 />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label={t('removeAsset')}
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('removeAssetTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('removeAssetDescription', { filename: asset.filename })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void removeAsset(asset.id)}>
                              {t('removeAsset')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="size-4" />
              {t('mixerTitle')}
            </CardTitle>
            <CardDescription>{t('mixerDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeTrackIds.length === 0 ? <p className="text-sm text-muted-foreground">{t('emptyMixer')}</p> : activeTrackIds.map(trackId => {
              const track = audio.tracks.find(item => item.id === trackId)
              if (!track) return null
              const isPlaying = playingTrackIds.includes(trackId)
              return <div key={trackId} className="flex items-center gap-3 rounded-md border p-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{track.name}</span>
                <input aria-label={t('volume')} type="range" min="0" max="1" step="0.05" value={track.defaultVolume} onChange={event => updateTrack(trackId, { defaultVolume: Number(event.target.value) })} />
                <Button size="icon" variant="outline" onClick={() => updateTrack(trackId, { muted: !track.muted })}><Volume2 /></Button>
                <Button size="icon" variant="outline" onClick={() => updateTrack(trackId, { loop: !track.loop })}>{track.loop ? 'Loop' : 'Once'}</Button>
                <Select value={track.presetId ?? 'clean'} onValueChange={presetId => updateTrack(trackId, { presetId: presetId === 'clean' ? undefined : presetId })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">{t('presetClean')}</SelectItem>
                    <SelectItem value="underwater">{t('presetUnderwater')}</SelectItem>
                    <SelectItem value="tunnel">{t('presetTunnel')}</SelectItem>
                    <SelectItem value="distortion">{t('presetDistortion')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" onClick={() => void (isPlaying ? pauseTrack(trackId) : playTrack(trackId))}>{isPlaying ? <Pause /> : <Play />}</Button>
                <Button size="icon" variant="outline" onClick={() => stopTrack(trackId)}><Square /></Button>
                <Button size="icon" variant="outline" onClick={() => removeTrackFromMixer(trackId)} aria-label={t('removeFromMixer')}><X /></Button>
              </div>
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('scenesTitle')}</CardTitle>
            <CardDescription>{t('scenesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input value={sceneName} onChange={event => setSceneName(event.target.value)} placeholder={t('sceneNamePlaceholder')} />
              <Button onClick={saveScene}>{t('saveScene')}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {audio.scenes.map(scene => <Button key={scene.id} variant="outline" onClick={() => void activateScene(scene.id)}>{scene.name}</Button>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
