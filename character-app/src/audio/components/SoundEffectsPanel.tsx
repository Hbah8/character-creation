import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getLocalAudioAssetBinding } from '@/audio/services/localAudioAssetBindingRepository'
import { createSoundEffectPlaybackService } from '@/audio/services/soundEffectPlaybackService'
import type { AudioAssetAvailability } from '@/audio/services/audioAssetAvailabilityService'
import type { WorldAudio } from '@/world/types'

interface PermissionedFileHandle extends FileSystemFileHandle {
  queryPermission(descriptor: { mode: 'read' }): Promise<PermissionState>
  requestPermission(descriptor: { mode: 'read' }): Promise<PermissionState>
}

interface Props {
  audio: WorldAudio
  availability: Record<string, AudioAssetAvailability>
  onChange: (audio: WorldAudio) => void
  onPlaybackError: () => void
}

export function SoundEffectsPanel({ audio, availability, onChange, onPlaybackError }: Props) {
  const { t } = useTranslation('audio')
  const [expanded, setExpanded] = useState(true)
  const [selection, setSelection] = useState<'add' | string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [playing, setPlaying] = useState<string[]>([])
  const playback = useRef<ReturnType<typeof createSoundEffectPlaybackService> | null>(null)
  const onPlaybackErrorRef = useRef(onPlaybackError)

  useEffect(() => {
    onPlaybackErrorRef.current = onPlaybackError
  }, [onPlaybackError])

  useEffect(() => {
    let active = true
    const service = createSoundEffectPlaybackService(
      source => new Audio(source),
      file => URL.createObjectURL(file),
      source => URL.revokeObjectURL(source),
      (id, isPlaying) => {
        if (active) setPlaying(ids => isPlaying
          ? [...new Set([...ids, id])]
          : ids.filter(item => item !== id))
      },
      () => { if (active) onPlaybackErrorRef.current() },
    )
    playback.current = service
    return () => {
      active = false
      playback.current = null
      service.dispose()
    }
  }, [])

  async function play(buttonId: string, assetId: string): Promise<void> {
    const service = playback.current
    if (!service) return
    try {
      const binding = await getLocalAudioAssetBinding(assetId)
      if (!binding) throw new Error('audio.asset.missing')
      const handle = binding.fileHandle as PermissionedFileHandle
      const permission = await handle.queryPermission({ mode: 'read' })
      if (permission !== 'granted' && await handle.requestPermission({ mode: 'read' }) !== 'granted') {
        throw new Error('audio.asset.permission')
      }
      const file = await handle.getFile()
      if (playback.current !== service) return
      await service.play(buttonId, file)
    } catch {
      if (playback.current === service) onPlaybackError()
    }
  }

  function chooseAsset(assetId: string): void {
    if (selection === 'add') {
      onChange({ ...audio, soundButtons: [...audio.soundButtons, { id: crypto.randomUUID(), assetId }] })
    } else if (selection !== null) {
      onChange({ ...audio, soundButtons: audio.soundButtons.map(button =>
        button.id === selection ? { ...button, assetId } : button) })
    }
    setSelection(null)
  }

  return (
    <section data-sound-effects className="flex max-h-[45dvh] shrink-0 flex-col border-t bg-card text-card-foreground">
      <Button
        variant="ghost"
        className="w-full justify-between rounded-none"
        aria-expanded={expanded}
        aria-controls="sound-effects-content"
        onClick={() => setExpanded(value => !value)}
      >
        {t('soundEffectsTitle')}
        {expanded ? <ChevronDown data-icon="inline-end" /> : <ChevronUp data-icon="inline-end" />}
      </Button>
      {expanded && (
        <div id="sound-effects-content" className="flex flex-wrap gap-2 overflow-y-auto p-3">
          {audio.soundButtons.map(button => {
            const asset = audio.assets.find(item => item.id === button.assetId)
            if (!asset) return null
            const status = availability[asset.id]
            const label = button.name ?? asset.filename
            return (
              <div key={button.id} className="relative size-24">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={playing.includes(button.id) ? 'default' : 'outline'}
                      className="size-full aspect-square pr-6"
                      aria-label={label}
                      onClick={() => void play(button.id, asset.id)}
                    >
                      <span data-sound-label className="line-clamp-3 w-full min-w-0 whitespace-normal text-center">
                        {label.split(/(\s+)/).map((part, index) => (
                          /^\s+$/.test(part) ? part : (
                            <span key={index} data-sound-word className="inline-block max-w-full truncate align-bottom">
                              {part}
                            </span>
                          )
                        ))}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="break-words">{label}</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-0 top-0"
                      aria-label={t('soundButtonMenu', { filename: label })}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => {
                        setName(label)
                        setRenaming(button.id)
                      }}>{t('renameSoundButton')}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setSelection(button.id)}>{t('replaceSound')}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onChange({
                        ...audio, soundButtons: audio.soundButtons.filter(item => item.id !== button.id),
                      })}>{t('removeSoundButton')}</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {status && status !== 'available' && (
                  <span className="sr-only">{t(status === 'permission-required' ? 'permissionRequired' : status)}</span>
                )}
              </div>
            )
          })}
          <Button
            variant="outline"
            className="size-24 aspect-square"
            aria-label={t('addSoundButton')}
            onClick={() => setSelection('add')}
          >
            <Plus />
          </Button>
        </div>
      )}
      <Dialog open={selection !== null} onOpenChange={open => { if (!open) setSelection(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('selectSound')}</DialogTitle>
            <DialogDescription>{t('selectSoundDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
            {audio.assets.length === 0 ? <p>{t('emptyLibrary')}</p> : audio.assets.map(asset => (
              <Button key={asset.id} variant="outline" className="justify-start" onClick={() => chooseAsset(asset.id)}>
                <span className="truncate">{asset.filename}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={renaming !== null} onOpenChange={open => { if (!open) setRenaming(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('renameSoundButton')}</DialogTitle>
            <DialogDescription>{t('renameSoundDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={event => {
            event.preventDefault()
            const trimmed = name.trim()
            if (!trimmed || renaming === null) return
            onChange({
              ...audio,
              soundButtons: audio.soundButtons.map(button =>
                button.id === renaming ? { ...button, name: trimmed } : button),
            })
            setRenaming(null)
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sound-button-name">{t('soundButtonName')}</FieldLabel>
                <Input id="sound-button-name" value={name} onChange={event => setName(event.target.value)} />
              </Field>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRenaming(null)}>{t('cancel')}</Button>
                <Button type="submit" disabled={!name.trim()}>{t('saveSoundButton')}</Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
